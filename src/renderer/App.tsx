import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import { useEffect, useState } from 'react';
import log from 'electron-log/renderer';
import IpcService from '../ipc/IpcService';
import GameButton from './components/GameButton';
import GameSettings from './components/GameSettings';
import { IpcRequest } from '../ipc/IpcChannelInterface';

export default function App() {
    const [data, setData] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const ipc = new IpcService();
        const fetchData = async () => {
            try {
                const response = await ipc.send<any[]>('game-library', {
                    params: ['getGames'],
                });
                setData(response);
            } catch (error) {
                log.error(error);
            }
        };

        ipc.listen('navigate', (request: IpcRequest) => {
            navigate(request.params![0]);
        });

        fetchData();
    }, [navigate]);

    return (
        <Routes>
            <Route
                path="/"
                element={data.map((runnable, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <GameButton key={index} runnable={runnable} />
                ))}
            />
            <Route path="/game-settings" element={<GameSettings />} />
        </Routes>
    );
}
