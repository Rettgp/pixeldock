import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import { useCallback, useEffect, useState } from 'react';
import log from 'electron-log/renderer';
import GameDial from './components/GameDial';
import SettingsPanel from './components/SettingsPanel';
import SetupWizard from './components/SetupWizard';
import { IpcRequest } from '../ipc/IpcChannelInterface';
import { api } from './api';
import { useLibrary } from './hooks';

type SetupState = 'loading' | 'needed' | 'ready';

export default function App() {
    const navigate = useNavigate();
    const [setup, setSetup] = useState<SetupState>('loading');
    const games = useLibrary(setup === 'ready');

    useEffect(() => {
        api.fetchSettings()
            .then((settings) =>
                api.validate({
                    steamLibraryCache: settings.steamLibraryCache ?? '',
                    steamGamesLibrary: settings.steamGamesLibrary ?? '',
                }),
            )
            .then((validation) => {
                setSetup(validation.valid ? 'ready' : 'needed');
                return validation;
            })
            .catch((error) => {
                log.error(error);
                setSetup('needed');
            });
    }, []);

    useEffect(
        () =>
            api.listen('navigate', (request: IpcRequest) => {
                navigate(`/${request.params![0]}`);
            }),
        [navigate],
    );

    const completeSetup = useCallback(() => {
        setSetup('ready');
        navigate('/');
    }, [navigate]);

    if (setup === 'loading') return null;

    if (setup === 'needed') {
        // Setup cannot be skipped: every route shows the wizard
        return <SetupWizard onComplete={completeSetup} />;
    }

    return (
        <Routes>
            <Route path="/" element={<GameDial games={games} />} />
            <Route path="/settings" element={<SettingsPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
