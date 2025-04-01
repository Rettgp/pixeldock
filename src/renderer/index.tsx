import { createRoot } from 'react-dom/client';
import App from './App';
import IpcService from '../ipc/IpcService';
import ExampleChannel from '../ipc/ExampleChannel';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

const ipc = new IpcService();
ipc.send<{ reply: string }>(ExampleChannel.name)
    .then((reply) => {
        console.log(reply);
        return reply;
    })
    .catch(() => {});
