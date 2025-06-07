import { Button } from '@mui/joy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import log from 'electron-log/renderer';
import { Settings } from '../../main/StorageType';
import IpcService from '../../ipc/IpcService';

export default function SettingsPanel() {
    const navigate = useNavigate();
    const [, setSettings] = useState<Settings>();

    const fetchSettings = async () => {
        const ipc = new IpcService();
        ipc.send<Settings>('settings', {
            params: ['fetch'],
        })
            .then((fetchedSettings) => {
                setSettings(fetchedSettings);
                return fetchedSettings;
            })
            .catch((error) => {
                log.error(error);
            });
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <Button
            variant="plain"
            startDecorator={<ArrowBackIcon sx={{ 'font-size': 'xx-large' }} />}
            onClick={() => {
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
    );
}
