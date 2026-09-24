import { IpcRequest } from './IpcChannelInterface';

export default class IpcService {
    public send<T>(channel: string, request: IpcRequest = {}): Promise<T> {
        if (!request.responseChannel) {
            request.responseChannel = `${channel}_response_${new Date().getTime()}_${Math.random().toString(36).slice(2)}`;
        }
        window.electron.ipcRenderer.send(channel, request);

        return new Promise((resolve) => {
            window.electron.ipcRenderer.once(
                request.responseChannel!,
                (response) => resolve(response),
            );
        });
    }

    // Returns an unsubscribe function for effect cleanup
    public listen(
        channel: string,
        callback: (request: IpcRequest) => void,
    ): () => void {
        return window.electron.ipcRenderer.on(channel, callback);
    }
}
