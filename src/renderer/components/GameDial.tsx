import './GameDial.css';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import {
    KeyboardEvent,
    MouseEvent,
    RefObject,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    WheelEvent,
} from 'react';
import { api, Runnable } from '../api';

interface Props {
    games: Runnable[];
}

// Resting medallion diameter and vertical distance between neighbours
const MEDALLION = 72;
const SPACING = 100;
// How far the dial reaches into the desktop, and where items start fading
const MAX_DEPTH = 160;
const FADE_START = 0.8;
const WHEEL_PX_PER_ITEM = 110;
const SNAP_DELAY_MS = 140;
const EASE_RATE = 14;
const MORPH_MS = 200;

// Remembered across visits to Settings so the dial doesn't jump back
let savedOffset = 0;

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const mod = (value: number, n: number) => ((value % n) + n) % n;

const prefersReducedMotion = () =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function useSize(ref: RefObject<HTMLElement | null>) {
    const [size, setSize] = useState({ width: 500, height: 900 });
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return undefined;
        const update = () =>
            setSize({
                width: element.clientWidth,
                height: element.clientHeight,
            });
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);
    return size;
}

function GameIcon({ game, className }: { game: Runnable; className: string }) {
    const [failed, setFailed] = useState('');
    if (game.iconPath && game.iconPath !== failed) {
        return (
            <img
                className={className}
                src={game.iconPath}
                alt=""
                draggable={false}
                onError={() => setFailed(game.iconPath)}
            />
        );
    }
    return (
        <span className={`${className} dial-monogram`} aria-hidden>
            {game.name.trim().charAt(0).toUpperCase() || '?'}
        </span>
    );
}

interface CardProps {
    game: Runnable;
    left: number;
    top: number;
    width: number;
    height: number;
    // Medallion centre (relative to the card) and radius the morph starts from
    originX: number;
    originY: number;
    originRadius: number;
    closing: boolean;
    launching: boolean;
    onLaunch: () => void;
    onLeave: (event: MouseEvent) => void;
    onClosed: () => void;
}

// The medallion blooms into the hero card: a circular clip grows into the
// rounded card while the icon dissolves into the hero art.
function MorphCard({
    game,
    left,
    top,
    width,
    height,
    originX,
    originY,
    originRadius,
    closing,
    launching,
    onLaunch,
    onLeave,
    onClosed,
}: CardProps) {
    const [open, setOpen] = useState(false);
    const [failedLogo, setFailedLogo] = useState('');
    const cardRef = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        // Flush the collapsed styles, then open in the same frame so the
        // growth transitions without waiting on extra animation frames
        cardRef.current?.getBoundingClientRect();
        setOpen(true);
    }, []);

    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return undefined;
        }
        if (!closing) {
            // Re-hovered while collapsing: grow back
            setOpen(true);
            return undefined;
        }
        setOpen(false);
        const timer = setTimeout(onClosed, MORPH_MS + 40);
        return () => clearTimeout(timer);
    }, [closing, onClosed]);

    const r = originRadius;
    const collapsed = `inset(${originY - r}px ${width - originX - r}px ${height - originY - r}px ${originX - r}px round ${r}px)`;
    const showLogo = game.logoPath && game.logoPath !== failedLogo;

    return (
        <div
            className={`dial-card-wrap ${open ? 'is-open' : ''} ${launching ? 'is-launching' : ''}`}
            style={{ left, top, width, height }}
        >
            <div className="dial-card-shadow" />
            <button
                ref={cardRef}
                type="button"
                className="dial-card"
                style={{
                    clipPath: open ? 'inset(0px round 20px)' : collapsed,
                    transitionDuration: `${MORPH_MS}ms`,
                }}
                aria-label={`Play ${game.name}`}
                onClick={onLaunch}
                onMouseLeave={onLeave}
            >
                <div
                    className={`dial-card-art ${game.heroPath ? '' : 'no-art'}`}
                    style={{
                        backgroundImage: game.heroPath
                            ? `url("${game.heroPath}")`
                            : undefined,
                        transformOrigin: `${originX}px ${originY}px`,
                    }}
                />
                <div className="dial-card-shade" />
                <span
                    className="dial-card-morph-icon"
                    style={{ left: originX, top: originY }}
                >
                    <GameIcon game={game} className="dial-icon" />
                </span>
                {showLogo ? (
                    <img
                        className="dial-card-logo"
                        src={game.logoPath}
                        alt={game.name}
                        draggable={false}
                        onError={() => setFailedLogo(game.logoPath)}
                    />
                ) : (
                    <span className="dial-card-title">{game.name}</span>
                )}
                <span className="dial-card-play">
                    <PlayArrowRounded />
                </span>
            </button>
        </div>
    );
}

export default function GameDial({ games }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { width, height } = useSize(containerRef);
    const n = games.length;

    // Geometry: a flattened half ellipse whose centre sits just past the right
    // edge, hugging it so the dial only reaches a little way into the desktop.
    const cx = width + 40;
    const cy = height / 2;
    const ry = Math.max(200, height / 2 - 40);
    const rx = clamp(width * 0.3, 120, MAX_DEPTH);
    const visibleHalf = Math.max(1, Math.floor(ry / SPACING));

    // `offset` is unbounded: game i sits at every position i + k·n
    const [offset, setOffset] = useState(savedOffset);
    const offsetRef = useRef(savedOffset);
    const targetRef = useRef(savedOffset);
    const frameRef = useRef(0);
    const snapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [hovered, setHovered] = useState<number | null>(null);
    const [closing, setClosing] = useState(false);
    const [launching, setLaunching] = useState(false);

    const animate = useCallback(() => {
        cancelAnimationFrame(frameRef.current);
        if (prefersReducedMotion()) {
            offsetRef.current = targetRef.current;
            setOffset(targetRef.current);
            return;
        }
        let last = performance.now();
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const delta = targetRef.current - offsetRef.current;
            if (Math.abs(delta) < 0.0015) {
                offsetRef.current = targetRef.current;
                setOffset(targetRef.current);
                return;
            }
            offsetRef.current += delta * (1 - Math.exp(-dt * EASE_RATE));
            setOffset(offsetRef.current);
            frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
    }, []);

    const scrollTo = useCallback(
        (target: number) => {
            targetRef.current = target;
            savedOffset = target;
            animate();
        },
        [animate],
    );

    useEffect(
        () => () => {
            cancelAnimationFrame(frameRef.current);
            clearTimeout(snapTimer.current);
        },
        [],
    );

    const closeCard = useCallback(() => {
        setHovered(null);
        setClosing(false);
    }, []);

    const onWheel = (event: WheelEvent) => {
        if (n === 0) return;
        const pixels = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY;
        if (hovered !== null) setClosing(true);
        targetRef.current += pixels / WHEEL_PX_PER_ITEM;
        animate();
        clearTimeout(snapTimer.current);
        snapTimer.current = setTimeout(
            () => scrollTo(Math.round(targetRef.current)),
            SNAP_DELAY_MS,
        );
    };

    const focusedVirtual = Math.round(offset);
    const focusedGame = n > 0 ? games[mod(focusedVirtual, n)] : undefined;

    const launch = (game: Runnable) => {
        setLaunching(true);
        api.playGame(game.exe);
        setTimeout(() => {
            setLaunching(false);
            closeCard();
        }, 650);
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown') scrollTo(focusedVirtual + 1);
        else if (event.key === 'ArrowUp') scrollTo(focusedVirtual - 1);
        else if (event.key === 'Enter' && focusedGame) launch(focusedGame);
        else return;
        event.preventDefault();
    };

    // With fewer games than slots, show each game once and fade the seam
    const windowHalf = n > 0 ? Math.min(visibleHalf + 1, n / 2) : 0;
    const limitedByCount = n / 2 < visibleHalf + 1;
    const items = [];
    for (
        let v = Math.floor(offset - windowHalf);
        v <= Math.ceil(offset + windowHalf);
        v += 1
    ) {
        const u = v - offset;
        const inWindow = limitedByCount
            ? u >= -n / 2 && u < n / 2
            : Math.abs(u) <= windowHalf;
        const ratio = (u * SPACING) / ry;
        if (n > 0 && inWindow && Math.abs(ratio) < 1) {
            const t = Math.abs(ratio);
            const focus = clamp(1 - Math.abs(u), 0, 1);
            const edgeFade = clamp((1 - t) / (1 - FADE_START), 0, 1);
            const seamFade = limitedByCount
                ? clamp((n / 2 - Math.abs(u)) / 0.5, 0, 1)
                : 1;
            items.push({
                v,
                game: games[mod(v, n)],
                x: cx - rx * Math.sqrt(1 - ratio * ratio),
                y: cy + u * SPACING,
                scale: 1 - 0.3 * t * t + 0.16 * focus,
                opacity: (1 - 0.45 * t) * edgeFade * seamFade,
                focus,
            });
        }
    }

    // Card geometry for the hovered medallion
    const cardWidth = Math.min(width - 24, 380);
    const cardHeight = Math.round(cardWidth / 2.6);
    const active = items.find((item) => item.v === hovered);

    // The open card and its game's hover band act as one hover region:
    // moving between them keeps the card open, leaving both closes it.
    const leaveHover = (event: MouseEvent) => {
        const to = event.relatedTarget;
        if (
            to instanceof Element &&
            (to.closest('.dial-card-wrap') ||
                to.closest(`[data-hit="${hovered}"]`))
        ) {
            return;
        }
        if (!launching) setClosing(true);
    };
    // The hovered game can scroll out of view before its card finishes
    // closing; drop the stale hover so the dial doesn't think a card is open.
    const staleHover = hovered !== null && !active;
    useEffect(() => {
        if (staleHover) closeCard();
    }, [staleHover, closeCard]);
    let card = null;
    if (active) {
        const left = clamp(
            active.x - cardWidth * 0.62,
            12,
            width - cardWidth - 12,
        );
        const top = clamp(
            active.y - cardHeight / 2,
            12,
            height - cardHeight - 12,
        );
        card = (
            <MorphCard
                key={active.v}
                game={active.game}
                left={left}
                top={top}
                width={cardWidth}
                height={cardHeight}
                originX={active.x - left}
                originY={active.y - top}
                originRadius={(MEDALLION / 2) * active.scale}
                closing={closing}
                launching={launching}
                onLaunch={() => launch(active.game)}
                onLeave={leaveHover}
                onClosed={closeCard}
            />
        );
    }

    // Accent notch on the outer track marking the selection slot
    const outerRx = rx + MEDALLION / 2 + 14;
    const outerRy = ry + MEDALLION / 2 + 14;
    const notchAngle = Math.asin(clamp((SPACING * 0.3) / outerRy, 0, 1));
    const notchX = cx - outerRx * Math.cos(notchAngle);
    const notchPath = `M ${notchX} ${cy - outerRy * Math.sin(notchAngle)} A ${outerRx} ${outerRy} 0 0 0 ${notchX} ${cy + outerRy * Math.sin(notchAngle)}`;
    const focused = items.find((item) => item.v === focusedVirtual);

    return (
        <div
            ref={containerRef}
            className={`dial ${active ? 'has-card' : ''}`}
            onWheel={onWheel}
            onKeyDown={onKeyDown}
            role="listbox"
            aria-label="Game library"
            aria-activedescendant={
                focused ? `dial-item-${focused.v}` : undefined
            }
            tabIndex={0}
        >
            <svg
                className="dial-track"
                width={width}
                height={height}
                aria-hidden
            >
                <defs>
                    <linearGradient id="dial-notch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A6CF98" />
                        <stop offset="100%" stopColor="#4E8A5E" />
                    </linearGradient>
                </defs>
                <ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry}
                    className="dial-track-line"
                />
                <ellipse
                    cx={cx}
                    cy={cy}
                    rx={outerRx}
                    ry={outerRy}
                    className="dial-track-line faint"
                />
                <path d={notchPath} className="dial-notch" />
            </svg>

            {/*
              The card opens pinned to the screen edge, so each game's hover
              area runs from its icon to the edge. Bands are one SPACING tall
              and stack without gaps, so sliding along the edge moves between
              games.
            */}
            {items.map((item) => {
                const hitLeft = item.x - (MEDALLION / 2) * item.scale;
                return (
                    <div
                        key={`hit-${item.v}`}
                        className="dial-hit"
                        aria-hidden
                        style={{
                            left: hitLeft,
                            top: item.y - SPACING / 2,
                            width: Math.max(0, width - hitLeft),
                            height: SPACING,
                        }}
                        data-hit={item.v}
                        onMouseEnter={() => {
                            setClosing(false);
                            setHovered(item.v);
                        }}
                        onMouseLeave={leaveHover}
                        onClick={() => launch(item.game)}
                    />
                );
            })}

            {items.map((item) => (
                <button
                    type="button"
                    key={item.v}
                    id={`dial-item-${item.v}`}
                    role="option"
                    aria-selected={item.v === focusedVirtual}
                    aria-label={item.game.name}
                    tabIndex={-1}
                    className={`dial-item ${item.v === focusedVirtual ? 'is-focused' : ''} ${item.v === hovered ? 'is-morphing' : ''}`}
                    style={{
                        width: MEDALLION,
                        height: MEDALLION,
                        transform: `translate(${item.x - MEDALLION / 2}px, ${item.y - MEDALLION / 2}px) scale(${item.scale})`,
                        opacity: item.opacity,
                        zIndex: Math.round(item.focus * 10) + 1,
                    }}
                    onMouseEnter={() => {
                        setClosing(false);
                        setHovered(item.v);
                    }}
                    onClick={() => launch(item.game)}
                >
                    <GameIcon game={item.game} className="dial-icon" />
                </button>
            ))}

            {focused && focusedGame && (
                <span
                    className="dial-label"
                    style={{
                        right: width - (notchX - 12),
                        top: focused.y,
                        maxWidth: Math.max(80, notchX - 28),
                        opacity: focused.focus ** 2,
                    }}
                >
                    {focusedGame.name}
                </span>
            )}

            {card}
        </div>
    );
}
