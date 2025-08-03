import { IpcMainEvent, dialog } from 'electron';
import log from 'electron-log/renderer';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';

export default class OpenFileChannel implements IpcChannelInterface {
    static name: string = 'open-file';

    getName(): string {
        return OpenFileChannel.name;
    }

    handle(event: IpcMainEvent, request: IpcRequest): void {
        if (!request.responseChannel) {
            request.responseChannel = `${this.getName()}_response`;
        }

        if (!request.params) {
            return;
        }

        const mode = request.params![0];
        if (mode !== 'openFile' && mode !== 'openDirectory') {
            log.error(`Invalid mode: ${mode}`);
            event.reply(request.responseChannel!, null);
            return;
        }

        const dialogPromise = dialog.showOpenDialog({
            properties: [mode],
        });

        dialogPromise
            .then((result) => {
                let toSend = null;
                if (!result.canceled && result.filePaths.length !== 0) {
                    [toSend] = result.filePaths;
                }
                event.reply(request.responseChannel!, toSend);
                return toSend;
            })
            .catch((error) => {
                log.error(error);
                event.reply(request.responseChannel!, null);
            });
    }
}
