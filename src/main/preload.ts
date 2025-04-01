// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IpcRequest } from '../ipc/IpcChannelInterface';
// import Channel from '../types/Channel';

const electronHandler = {
    ipcRenderer: {
        send(channel: string, request: IpcRequest) {
            ipcRenderer.send(channel, request);
        },
        on(channel: string, func: (request: IpcRequest) => void) {
            const subscription = (
                _event: IpcRendererEvent,
                request: IpcRequest,
            ) => func(request);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },
        once(channel: string, func: (response: any) => void) {
            ipcRenderer.once(channel, (_event, response) => func(response));
        },
    },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
