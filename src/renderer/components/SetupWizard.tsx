import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/joy';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import log from 'electron-log/renderer';
import { api, SteamPaths } from '../api';
import { usePathValidation } from '../hooks';
import { tokens } from '../theme';
import Panel from './Panel';
import PathField from './PathField';
import NonSteamHelp from './NonSteamHelp';

const STEPS = ['Library cache', 'Game library', 'Finish'];

interface Props {
    onComplete: () => void;
}

function StepDots({ active }: { active: number }) {
    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {STEPS.map((step, index) => (
                <Box
                    key={step}
                    aria-label={step}
                    sx={{
                        height: 6,
                        width: index === active ? 28 : 6,
                        borderRadius: 999,
                        background:
                            index <= active
                                ? tokens.accentGradient
                                : tokens.hairline,
                        transition: 'width 200ms ease, background 200ms ease',
                    }}
                />
            ))}
            <Typography level="body-xs" sx={{ color: tokens.textMuted, ml: 1 }}>
                Step {active + 1} of {STEPS.length}
            </Typography>
        </Box>
    );
}

export default function SetupWizard({ onComplete }: Props) {
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [paths, setPaths] = useState<SteamPaths>({
        steamLibraryCache: '',
        steamGamesLibrary: '',
    });
    const { validation, pending } = usePathValidation(paths);

    // Prefill with whatever is saved, falling back to a detected Steam install
    useEffect(() => {
        Promise.all([api.fetchSettings(), api.detectPaths()])
            .then(([settings, detected]) => {
                setPaths({
                    steamLibraryCache:
                        settings.steamLibraryCache ||
                        detected.steamLibraryCache,
                    steamGamesLibrary:
                        settings.steamGamesLibrary ||
                        detected.steamGamesLibrary,
                });
                return settings;
            })
            .catch((error) => log.error(error));
    }, []);

    const cacheOk = !pending && !!validation?.steamLibraryCache.ok;
    const gamesOk = !pending && !!validation?.steamGamesLibrary.ok;
    const canContinue = [cacheOk, gamesOk, cacheOk && gamesOk][step];
    const extraLibraries = (validation?.libraryFolders ?? []).filter(
        (dir) => dir.toLowerCase() !== paths.steamGamesLibrary.toLowerCase(),
    );

    const finish = () => {
        setSaving(true);
        return api
            .saveSettings(paths)
            .then((result) => {
                if (result?.ok) onComplete();
                return result;
            })
            .catch((error) => log.error(error))
            .finally(() => setSaving(false));
    };

    const titles = [
        {
            eyebrow: 'Welcome to PixelDock',
            title: 'Where is Steam’s artwork?',
            body: 'PixelDock uses Steam’s library cache for game artwork. It usually sits inside your Steam install folder.',
        },
        {
            eyebrow: 'Almost there',
            title: 'Where are your games installed?',
            body: 'Pick a steamapps folder. Your other Steam library folders are found automatically.',
        },
        {
            eyebrow: 'All set',
            title: 'Your library is ready',
            body: 'Games you install, and non-Steam games you add in Steam, appear in the dock right away.',
        },
    ][step];

    return (
        <Panel
            header={
                <Box sx={{ display: 'grid', gap: 2 }}>
                    <StepDots active={step} />
                    <Box key={step} sx={{ animation: 'pd-fade-in 200ms ease' }}>
                        <Typography
                            level="body-sm"
                            sx={{ color: tokens.accent, fontWeight: 500 }}
                        >
                            {titles.eyebrow}
                        </Typography>
                        <Typography
                            level="h2"
                            sx={{
                                fontWeight: 300,
                                letterSpacing: '-0.02em',
                                mt: 0.5,
                                mb: 1,
                            }}
                        >
                            {titles.title}
                        </Typography>
                        <Typography
                            level="body-md"
                            sx={{ color: tokens.textMuted, lineHeight: 1.6 }}
                        >
                            {titles.body}
                        </Typography>
                    </Box>
                </Box>
            }
            footer={
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        justifyContent: 'space-between',
                    }}
                >
                    <Button
                        variant="plain"
                        color="neutral"
                        startDecorator={<ArrowBackRounded />}
                        onClick={() => setStep((s) => s - 1)}
                        sx={{ visibility: step === 0 ? 'hidden' : 'visible' }}
                    >
                        Back
                    </Button>
                    {step < STEPS.length - 1 ? (
                        <Button
                            disabled={!canContinue}
                            endDecorator={<ArrowForwardRounded />}
                            onClick={() => setStep((s) => s + 1)}
                        >
                            Continue
                        </Button>
                    ) : (
                        <Button
                            disabled={!canContinue}
                            loading={saving}
                            onClick={finish}
                        >
                            Open my library
                        </Button>
                    )}
                </Box>
            }
        >
            <Box
                key={step}
                sx={{
                    animation: 'pd-fade-in 200ms ease',
                    display: 'grid',
                    gap: 2,
                }}
            >
                {step === 0 && (
                    <PathField
                        label="Steam library cache"
                        placeholder="C:\Program Files (x86)\Steam\appcache\librarycache"
                        value={paths.steamLibraryCache}
                        onChange={(value) =>
                            setPaths((p) => ({
                                ...p,
                                steamLibraryCache: value,
                            }))
                        }
                        status={validation?.steamLibraryCache}
                        pending={pending}
                    />
                )}
                {step === 1 && (
                    <>
                        <PathField
                            label="Steam game library"
                            placeholder="D:\SteamLibrary\steamapps"
                            value={paths.steamGamesLibrary}
                            onChange={(value) =>
                                setPaths((p) => ({
                                    ...p,
                                    steamGamesLibrary: value,
                                }))
                            }
                            status={validation?.steamGamesLibrary}
                            pending={pending}
                        />
                        {gamesOk && extraLibraries.length > 0 && (
                            <Typography
                                level="body-sm"
                                sx={{ color: tokens.textMuted }}
                            >
                                Also including {extraLibraries.length} other
                                Steam{' '}
                                {extraLibraries.length === 1
                                    ? 'library'
                                    : 'libraries'}
                                : {extraLibraries.join(', ')}
                            </Typography>
                        )}
                    </>
                )}
                {step === 2 && <NonSteamHelp />}
            </Box>
        </Panel>
    );
}
