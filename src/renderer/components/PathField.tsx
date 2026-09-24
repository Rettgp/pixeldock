import {
    Box,
    CircularProgress,
    FormControl,
    FormHelperText,
    FormLabel,
    IconButton,
    Input,
    Tooltip,
} from '@mui/joy';
import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import log from 'electron-log/renderer';
import { api } from '../api';
import type { PathValidation } from '../../main/SteamSetupValidator';
import { tokens } from '../theme';

interface Props {
    label: string;
    description?: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    status?: PathValidation;
    pending?: boolean;
}

export default function PathField({
    label,
    description,
    placeholder,
    value,
    onChange,
    status,
    pending,
}: Props) {
    const browse = () => {
        api.browseDirectory()
            .then((dir) => {
                if (dir) onChange(dir);
                return dir;
            })
            .catch((error) => log.error(error));
    };

    const showStatus = !pending && status && value.length > 0;
    let statusIcon = null;
    if (pending && value) {
        statusIcon = <CircularProgress size="sm" variant="plain" />;
    } else if (showStatus) {
        statusIcon = status.ok ? (
            <CheckCircleRounded sx={{ color: tokens.accent }} />
        ) : (
            <ErrorOutlineRounded sx={{ color: tokens.danger }} />
        );
    }

    return (
        <FormControl error={showStatus ? !status.ok : false}>
            <FormLabel sx={{ color: tokens.text, fontWeight: 500, mb: 0.25 }}>
                {label}
            </FormLabel>
            {description && (
                <Box
                    sx={{
                        color: tokens.textMuted,
                        fontSize: 'sm',
                        mb: 1,
                        lineHeight: 1.5,
                    }}
                >
                    {description}
                </Box>
            )}
            <Input
                size="lg"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                startDecorator={
                    <Box
                        sx={{
                            display: 'flex',
                            width: 24,
                            justifyContent: 'center',
                            animation: 'pd-fade-in 180ms ease',
                        }}
                        key={`${pending}-${status?.ok}`}
                    >
                        {statusIcon}
                    </Box>
                }
                endDecorator={
                    <Tooltip title="Browse" variant="soft">
                        <IconButton
                            variant="soft"
                            aria-label={`Browse for ${label}`}
                            onClick={browse}
                        >
                            <FolderOpenRounded />
                        </IconButton>
                    </Tooltip>
                }
                sx={{ fontSize: 'sm' }}
            />
            <FormHelperText
                sx={{
                    minHeight: '1.5em',
                    color: showStatus && status.ok ? tokens.accent : undefined,
                }}
            >
                {showStatus ? status.message : ' '}
            </FormHelperText>
        </FormControl>
    );
}
