import { IpcRequest } from './IpcChannelInterface';

export default class IpcService {
    public send<T>(channel: string, request: IpcRequest = {}): Promise<T> {
        if (!request.responseChannel) {
            request.responseChannel = `${channel}_response_${new Date().getTime()}`;
        }
        window.electron.ipcRenderer.send(channel, request);

        return new Promise((resolve) => {
            window.electron.ipcRenderer.once(
                request.responseChannel!,
                (response) => resolve(response),
            );
        });
    }

    public listen(channel: string, callback: (request: IpcRequest) => void) {
        window.electron.ipcRenderer.on(channel, callback);
    }
}
