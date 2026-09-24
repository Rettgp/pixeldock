import { extendTheme } from '@mui/joy/styles';

// Dark eco palette: near-black green base, glassy surfaces, sage accent.
export const tokens = {
    bg: '#070B09',
    glow: '#0F2E24',
    surface: 'rgba(255, 255, 255, 0.035)',
    surfaceHover: 'rgba(255, 255, 255, 0.06)',
    hairline: 'rgba(255, 255, 255, 0.08)',
    accent: '#7FB77E',
    accentGradient: 'linear-gradient(135deg, #A6CF98 0%, #4E8A5E 100%)',
    onAccent: '#06110B',
    text: '#F2F5F3',
    textMuted: '#8C9A92',
    danger: '#E07A6B',
};

const theme = extendTheme({
    fontFamily: {
        body: '"Inter", system-ui, sans-serif',
        display: '"Inter", system-ui, sans-serif',
    },
    fontWeight: {
        sm: 300,
        md: 400,
        lg: 500,
        xl: 600,
    },
    radius: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '28px',
    },
    colorSchemes: {
        dark: {
            palette: {
                primary: {
                    50: '#F1F7EF',
                    100: '#DDEBD7',
                    200: '#C3DDB8',
                    300: '#A6CF98',
                    400: '#8FC285',
                    500: '#7FB77E',
                    600: '#5F9A63',
                    700: '#4E8A5E',
                    800: '#2F5B3E',
                    900: '#1A3526',
                    solidColor: tokens.onAccent,
                    solidBg: tokens.accent,
                    solidHoverBg: '#8FC285',
                    solidActiveBg: '#A6CF98',
                    plainColor: '#A6CF98',
                    softColor: '#C3DDB8',
                    softBg: 'rgba(127, 183, 126, 0.12)',
                    softHoverBg: 'rgba(127, 183, 126, 0.2)',
                    outlinedBorder: 'rgba(127, 183, 126, 0.4)',
                    outlinedColor: '#A6CF98',
                },
                neutral: {
                    50: '#F2F5F3',
                    100: '#DCE3DE',
                    200: '#B9C4BD',
                    300: '#8C9A92',
                    400: '#6B7871',
                    500: '#4E5A54',
                    600: '#36403B',
                    700: '#252D29',
                    800: '#161C19',
                    900: '#0B100D',
                    outlinedBorder: tokens.hairline,
                    plainColor: '#DCE3DE',
                    plainHoverBg: tokens.surfaceHover,
                    softBg: tokens.surface,
                    softHoverBg: tokens.surfaceHover,
                },
                danger: {
                    300: '#F0A79B',
                    400: '#E8907F',
                    500: tokens.danger,
                    600: '#C4604F',
                    softColor: '#F0A79B',
                    softBg: 'rgba(224, 122, 107, 0.12)',
                },
                success: {
                    300: '#A6CF98',
                    400: '#8FC285',
                    500: tokens.accent,
                    softColor: '#A6CF98',
                    softBg: 'rgba(127, 183, 126, 0.12)',
                },
                background: {
                    body: tokens.bg,
                    surface: tokens.surface,
                    popup: '#101714',
                    level1: '#0D1310',
                    level2: '#121A16',
                    level3: '#18221D',
                },
                text: {
                    primary: tokens.text,
                    secondary: '#B9C4BD',
                    tertiary: tokens.textMuted,
                },
                divider: tokens.hairline,
                focusVisible: tokens.accent,
            },
        },
    },
    components: {
        JoyButton: {
            styleOverrides: {
                root: ({ ownerState }) => ({
                    borderRadius: '999px',
                    fontWeight: 500,
                    paddingInline: '1.25rem',
                    transition:
                        'background 180ms ease, transform 180ms ease, box-shadow 180ms ease',
                    ...(ownerState.variant === 'solid' &&
                        ownerState.color === 'primary' && {
                            background: tokens.accentGradient,
                            color: tokens.onAccent,
                            boxShadow: '0 8px 24px rgba(78, 138, 94, 0.25)',
                            '&:hover': {
                                background: tokens.accentGradient,
                                filter: 'brightness(1.08)',
                            },
                            '&.Mui-disabled': {
                                background: tokens.surface,
                                color: tokens.textMuted,
                                boxShadow: 'none',
                            },
                        }),
                }),
            },
        },
        JoyIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: '999px',
                    transition: 'background 180ms ease',
                },
            },
        },
        JoyInput: {
            styleOverrides: {
                root: {
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: tokens.hairline,
                    transition: 'border-color 180ms ease',
                    '--Input-focusedHighlight': tokens.accent,
                },
            },
        },
        JoySelect: {
            styleOverrides: {
                root: {
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: tokens.hairline,
                    '--Select-focusedHighlight': tokens.accent,
                },
            },
        },
        JoyCard: {
            styleOverrides: {
                root: {
                    borderRadius: '20px',
                    backgroundColor: tokens.surface,
                    borderColor: tokens.hairline,
                    backdropFilter: 'blur(12px)',
                },
            },
        },
    },
});

export default theme;
