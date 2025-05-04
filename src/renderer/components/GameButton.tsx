import './GameButton.css';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useEffect, useState } from 'react';
import IpcService from '../../ipc/IpcService';
import { Runnable } from '../../main/types';

function runGame(exePath: string) {
    const ipc = new IpcService();
    ipc.send<{ reply: any }>('game-library', {
        params: ['playGame', exePath],
    });
}

interface Props {
    runnable: Runnable;
}

export default function GameButton({ runnable }: Props) {
    const [isClicked, setIsClicked] = useState(false);

    useEffect(() => {
        console.log(
            'BackgroundImage for',
            runnable.name,
            '→',
            runnable.heroPath,
        );
    }, [runnable]);

    return (
        <button
            type="button"
            className={`game-button ${isClicked ? 'fly-out' : ''}`}
            onClick={() => {
                setIsClicked(true);
                runGame(runnable.exe);
            }}
            style={{
                // TODO: This needs to scan for a library_hero or a library_header
                backgroundImage: `url(${runnable.heroPath})`,
            }}
            onAnimationEnd={() => setIsClicked(false)}
        >
            <div className="hover-background" />
            <h1 className="game-title">{runnable.name}</h1>
            <div className="play-overlay">
                <PlayCircleOutlineIcon sx={{ 'font-size': 'xxx-large' }} />
            </div>
        </button>
    );
}
