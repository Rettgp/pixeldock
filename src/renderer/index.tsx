import { createRoot } from 'react-dom/client';
import log from 'electron-log/renderer';
import App from './App';
import IpcService from '../ipc/IpcService';
import ExampleChannel from '../ipc/ExampleChannel';
import '@fontsource/inter';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

const ipc = new IpcService();
ipc.send<{ reply: string }>(ExampleChannel.name)
    .then((reply) => {
        log.info(reply);
        return reply;
    })
    .catch(() => {});
