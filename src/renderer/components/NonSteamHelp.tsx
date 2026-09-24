import { Box, Button, Card, Typography } from '@mui/joy';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import SportsEsportsRounded from '@mui/icons-material/SportsEsportsRounded';
import { tokens } from '../theme';

const STEPS = [
    'In Steam, open Games → Add a Non-Steam Game to My Library.',
    'Install SGDBoop, then use "Boop" on SteamGridDB to set the artwork.',
    'PixelDock picks up the game and its art right away.',
];

export default function NonSteamHelp() {
    return (
        <Card variant="outlined" sx={{ gap: 1.5, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: tokens.accentGradient,
                        color: tokens.onAccent,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <SportsEsportsRounded />
                </Box>
                <Box>
                    <Typography level="title-md" sx={{ fontWeight: 500 }}>
                        Adding non-Steam games
                    </Typography>
                    <Typography
                        level="body-sm"
                        sx={{ color: tokens.textMuted }}
                    >
                        Steam is the only place you manage your library.
                    </Typography>
                </Box>
            </Box>
            <Box
                component="ol"
                sx={{
                    m: 0,
                    pl: 0,
                    listStyle: 'none',
                    display: 'grid',
                    gap: 1,
                    counterReset: 'step',
                }}
            >
                {STEPS.map((step) => (
                    <Box
                        component="li"
                        key={step}
                        sx={{
                            display: 'flex',
                            gap: 1.25,
                            fontSize: 'sm',
                            color: '#B9C4BD',
                            lineHeight: 1.5,
                            counterIncrement: 'step',
                            '&::before': {
                                content: 'counter(step, decimal-leading-zero)',
                                color: tokens.accent,
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: 'xs',
                                pt: '2px',
                            },
                        }}
                    >
                        {step}
                    </Box>
                ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                    size="sm"
                    variant="soft"
                    color="neutral"
                    component="a"
                    href="steam://open/games"
                    target="_blank"
                >
                    Open Steam
                </Button>
                <Button
                    size="sm"
                    variant="soft"
                    color="neutral"
                    component="a"
                    href="https://www.steamgriddb.com/boop"
                    target="_blank"
                    endDecorator={<OpenInNewRounded sx={{ fontSize: 16 }} />}
                >
                    Get SGDBoop
                </Button>
            </Box>
        </Card>
    );
}
