import { ReactNode, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    IconButton,
    Modal,
    ModalDialog,
    Option,
    Select,
    Snackbar,
    Typography,
} from '@mui/joy';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import MonitorRounded from '@mui/icons-material/MonitorRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import { useNavigate } from 'react-router-dom';
import log from 'electron-log/renderer';
import { api, DisplayOption, SteamPaths } from '../api';
import { usePathValidation } from '../hooks';
import { tokens } from '../theme';
import Panel from './Panel';
import PathField from './PathField';
import NonSteamHelp from './NonSteamHelp';

interface FormState extends SteamPaths {
    display: number;
}

const EMPTY: FormState = {
    steamLibraryCache: '',
    steamGamesLibrary: '',
    display: 0,
};

function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}) {
    return (
        <Card variant="outlined" sx={{ gap: 2, p: 2.5 }}>
            <Box>
                <Typography level="title-md" sx={{ fontWeight: 500 }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        level="body-sm"
                        sx={{ color: tokens.textMuted, mt: 0.25 }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {children}
        </Card>
    );
}

export default function SettingsPanel() {
    const navigate = useNavigate();
    const [saved, setSaved] = useState<FormState>(EMPTY);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [displays, setDisplays] = useState<DisplayOption[]>([]);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [paths, setPaths] = useState<SteamPaths>(EMPTY);
    const { validation, pending } = usePathValidation(paths);

    useEffect(() => {
        Promise.all([api.fetchSettings(), api.listDisplays()])
            .then(([settings, displayOptions]) => {
                const primary = displayOptions.find((d) => d.primary);
                const state: FormState = {
                    steamLibraryCache: settings.steamLibraryCache ?? '',
                    steamGamesLibrary: settings.steamGamesLibrary ?? '',
                    display: settings.display || primary?.id || 0,
                };
                setDisplays(displayOptions);
                setSaved(state);
                setForm(state);
                return settings;
            })
            .catch((error) => log.error(error));
    }, []);

    // Only re-validate when the paths change, not the display
    useEffect(() => {
        setPaths({
            steamLibraryCache: form.steamLibraryCache,
            steamGamesLibrary: form.steamGamesLibrary,
        });
    }, [form.steamLibraryCache, form.steamGamesLibrary]);

    const dirty =
        form.steamLibraryCache !== saved.steamLibraryCache ||
        form.steamGamesLibrary !== saved.steamGamesLibrary ||
        form.display !== saved.display;
    const valid = !pending && !!validation?.valid;

    const save = () => {
        setSaving(true);
        return api
            .saveSettings(form)
            .then((result) => {
                if (result?.ok) {
                    setSaved(form);
                    setToast('Settings saved');
                } else {
                    setToast('Could not save settings');
                }
                return result;
            })
            .catch((error) => log.error(error))
            .finally(() => setSaving(false));
    };

    const refresh = () => {
        api.refreshLibrary()
            .then(() => setToast('Library refreshed'))
            .catch((error) => log.error(error));
    };

    let statusText = 'All changes saved';
    if (dirty) {
        statusText =
            !valid && !pending
                ? 'Fix the highlighted paths to save'
                : 'You have unsaved changes';
    }

    const back = () => {
        if (dirty) setConfirmLeave(true);
        else navigate('/');
    };

    return (
        <Panel
            header={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                        variant="soft"
                        color="neutral"
                        aria-label="Back to library"
                        onClick={back}
                    >
                        <ArrowBackRounded />
                    </IconButton>
                    <Typography
                        level="h2"
                        sx={{ fontWeight: 300, letterSpacing: '-0.02em' }}
                    >
                        Settings
                    </Typography>
                </Box>
            }
            footer={
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                    }}
                >
                    <Typography
                        level="body-sm"
                        sx={{ color: tokens.textMuted }}
                    >
                        {statusText}
                    </Typography>
                    <Button
                        disabled={!dirty || !valid}
                        loading={saving}
                        onClick={save}
                    >
                        Save changes
                    </Button>
                </Box>
            }
        >
            <Section
                title="Steam"
                subtitle="Where PixelDock finds your games and artwork."
            >
                <PathField
                    label="Library cache"
                    placeholder="C:\Program Files (x86)\Steam\appcache\librarycache"
                    value={form.steamLibraryCache}
                    onChange={(value) =>
                        setForm((f) => ({ ...f, steamLibraryCache: value }))
                    }
                    status={validation?.steamLibraryCache}
                    pending={pending}
                />
                <PathField
                    label="Game library (steamapps)"
                    placeholder="D:\SteamLibrary\steamapps"
                    value={form.steamGamesLibrary}
                    onChange={(value) =>
                        setForm((f) => ({ ...f, steamGamesLibrary: value }))
                    }
                    status={validation?.steamGamesLibrary}
                    pending={pending}
                />
            </Section>

            <Section
                title="Display"
                subtitle="Choose which monitor the dock sits on."
            >
                <Select
                    size="lg"
                    value={form.display || null}
                    startDecorator={<MonitorRounded />}
                    onChange={(_, value) =>
                        setForm((f) => ({ ...f, display: Number(value) }))
                    }
                    slotProps={{ listbox: { sx: { borderRadius: '14px' } } }}
                >
                    {displays.map((display) => (
                        <Option key={display.id} value={display.id}>
                            {display.label}
                            {display.primary ? ' (Primary)' : ''}
                        </Option>
                    ))}
                </Select>
            </Section>

            <Section
                title="Library"
                subtitle="Updates on its own when Steam changes. Refresh if something looks out of date."
            >
                <Box sx={{ display: 'grid', gap: 1 }}>
                    {(validation?.libraryFolders ?? []).map((dir) => (
                        <Box
                            key={dir}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontSize: 'sm',
                                color: '#B9C4BD',
                                wordBreak: 'break-all',
                            }}
                        >
                            <FolderRounded
                                sx={{ fontSize: 18, color: tokens.accent }}
                            />
                            {dir}
                        </Box>
                    ))}
                </Box>
                <Box>
                    <Button
                        variant="soft"
                        color="neutral"
                        startDecorator={<RefreshRounded />}
                        onClick={refresh}
                    >
                        Refresh now
                    </Button>
                </Box>
            </Section>

            <NonSteamHelp />

            <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)}>
                <ModalDialog
                    variant="outlined"
                    sx={{ borderRadius: '20px', maxWidth: 360 }}
                >
                    <Typography level="title-lg">Discard changes?</Typography>
                    <Typography
                        level="body-sm"
                        sx={{ color: tokens.textMuted }}
                    >
                        Your unsaved settings will be lost.
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                            mt: 1,
                        }}
                    >
                        <Button
                            variant="plain"
                            color="neutral"
                            onClick={() => setConfirmLeave(false)}
                        >
                            Keep editing
                        </Button>
                        <Button
                            variant="soft"
                            color="danger"
                            onClick={() => navigate('/')}
                        >
                            Discard
                        </Button>
                    </Box>
                </ModalDialog>
            </Modal>

            <Snackbar
                open={toast !== null}
                autoHideDuration={2500}
                onClose={() => setToast(null)}
                variant="soft"
                color={toast?.startsWith('Could') ? 'danger' : 'success'}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ borderRadius: '999px' }}
            >
                {toast}
            </Snackbar>
        </Panel>
    );
}
