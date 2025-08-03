import {
    Box,
    Button,
    FormControl,
    FormLabel,
    IconButton,
    Input,
} from '@mui/joy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useNavigate } from 'react-router-dom';
import { ChangeEvent, useEffect, useState } from 'react';
import log from 'electron-log/renderer';
import { v4 as uuidv4 } from 'uuid';
import { Settings } from '../../main/StorageType';
import IpcService from '../../ipc/IpcService';

const openFileBrowser = (): Promise<string> => {
    const ipc = new IpcService();
    return ipc.send<string>('open-file', {
        params: ['openDirectory'],
    });
};

export default function SettingsPanel() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Settings>({
        _id: uuidv4(),
        steamLibraryCache: '',
        steamGamesLibrary: '',
        display: 1,
    });

    const fetchSettings = async () => {
        const ipc = new IpcService();
        ipc.send<Settings>('settings', {
            params: ['fetch'],
        })
            .then((fetchedSettings) => {
                setFormData((prev) => ({
                    ...prev,
                    ...fetchedSettings,
                    steamLibraryCache: fetchedSettings.steamLibraryCache ?? '',
                    steamGamesLibrary: fetchedSettings.steamGamesLibrary ?? '',
                    display: fetchedSettings.display ?? 1,
                    // eslint-disable-next-line no-underscore-dangle
                    _id: fetchedSettings._id ?? prev._id,
                }));
                return fetchedSettings;
            })
            .catch((error) => {
                log.error(error);
            });
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (field: string, e: ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = () => {
        const ipc = new IpcService();
        ipc.send<Response>('settings', {
            params: ['save', JSON.stringify(formData)],
        });
    };

    const handleBrowse = async (field: keyof Settings) => {
        openFileBrowser()
            .then((path) => {
                if (path) {
                    setFormData((prev) => ({ ...prev, [field]: path }));
                }
                return true;
            })
            .catch((error) => {
                log.error(error);
            });
    };

    return (
        <>
            <Button
                variant="plain"
                startDecorator={
                    <ArrowBackIcon sx={{ 'font-size': 'xx-large' }} />
                }
                onClick={() => {
                    handleSave();
                    navigate('/');
                }}
                sx={{
                    p: 0,
                    'font-size': 'xx-large',
                    color: 'white',
                    'paint-order': 'stroke fill',
                    '-webkit-text-stroke': '4px #333',
                    '&:hover': {
                        backgroundColor: 'transparent',
                        textDecoration: 'underline',
                    },
                    paddingBottom: '1rem',
                }}
            >
                Settings
            </Button>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                    <FormLabel sx={{ color: 'white ' }}>
                        Steam Library Cache
                    </FormLabel>
                    <Input
                        placeholder="Steam\appcache\librarycache"
                        value={formData.steamLibraryCache || ''}
                        onChange={(e) => handleChange('steamLibraryCache', e)}
                        sx={{ mb: 2 }}
                        size="lg"
                        endDecorator={
                            <IconButton
                                variant="plain"
                                onClick={() =>
                                    handleBrowse('steamLibraryCache')
                                }
                                sx={{ color: 'inherit' }}
                            >
                                <FolderOpenIcon />
                            </IconButton>
                        }
                    />
                </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                    <FormLabel sx={{ color: 'white ' }}>
                        Steam Games Library
                    </FormLabel>
                    <Input
                        placeholder="Steam\steamapps"
                        value={formData.steamGamesLibrary || ''}
                        onChange={(e) => handleChange('steamGamesLibrary', e)}
                        sx={{ mb: 2 }}
                        size="lg"
                        endDecorator={
                            <IconButton
                                variant="plain"
                                onClick={() =>
                                    handleBrowse('steamGamesLibrary')
                                }
                                sx={{ color: 'inherit' }}
                            >
                                <FolderOpenIcon />
                            </IconButton>
                        }
                    />
                </FormControl>
            </Box>
        </>
    );
}
