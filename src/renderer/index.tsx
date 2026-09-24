import { createRoot } from 'react-dom/client';
import { MemoryRouter as Router } from 'react-router-dom';
import { CssVarsProvider } from '@mui/joy/styles';
import log from 'electron-log/renderer';
import App from './App';
import IpcService from '../ipc/IpcService';
import ExampleChannel from '../ipc/ExampleChannel';
import theme from './theme';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
    <CssVarsProvider
        theme={theme}
        defaultMode="dark"
        modeStorageKey="pixeldock-mode"
        disableTransitionOnChange
    >
        <Router>
            <App />
        </Router>
    </CssVarsProvider>,
);

const ipc = new IpcService();
ipc.send<{ reply: string }>(ExampleChannel.name)
    .then((reply) => {
        log.info(reply);
        return reply;
    })
    .catch(() => {});
