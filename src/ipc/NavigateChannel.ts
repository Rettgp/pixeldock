import { IpcMainEvent } from 'electron';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';

export default class NavigateChannel implements IpcChannelInterface {
    static name: string = 'navigate';

    getName(): string {
        return NavigateChannel.name;
    }

    handle(event: IpcMainEvent, request: IpcRequest): void {
        if (!request.responseChannel) {
            request.responseChannel = `${this.getName()}_response`;
        }
        if (!request.params) {
            return;
        }

        if (request.params![0]) {
            event.reply(request.responseChannel!, request.params![0]);
        }
    }
}
