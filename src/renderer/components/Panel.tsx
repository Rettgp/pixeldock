import { ReactNode } from 'react';
import { Box } from '@mui/joy';
import { tokens } from '../theme';

interface Props {
    header?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
}

// Full-height opaque panel used by setup and settings inside the
// transparent launcher strip.
export default function Panel({ header, footer, children }: Props) {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: tokens.bg,
                backgroundImage: `radial-gradient(120% 60% at 70% -10%, ${tokens.glow} 0%, transparent 70%)`,
                borderLeft: `1px solid ${tokens.hairline}`,
                color: tokens.text,
                animation: 'pd-slide-in 200ms ease',
            }}
        >
            {header && <Box sx={{ px: 3, pt: 5, pb: 2 }}>{header}</Box>}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    px: 3,
                    pb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {children}
            </Box>
            {footer && (
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        borderTop: `1px solid ${tokens.hairline}`,
                        backgroundColor: 'rgba(7, 11, 9, 0.85)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    {footer}
                </Box>
            )}
        </Box>
    );
}
