import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect, useState } from 'react';
import log from 'electron-log/renderer';
import IpcService from '../ipc/IpcService';
import GameButton from './components/GameButton';

export default function App() {
    const [data, setData] = useState<any[]>([]);

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

        fetchData();
    }, []);

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={data.map((runnable, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <GameButton key={index} runnable={runnable} />
                    ))}
                />
            </Routes>
        </Router>
    );
}
