import { IpcMainEvent } from 'electron';
import log from 'electron-log/renderer';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';

export default class ExampleChannel implements IpcChannelInterface {
    static name: string = 'example';

    getName(): string {
        return ExampleChannel.name;
    }

    handle(event: IpcMainEvent, request: IpcRequest): void {
        if (!request.responseChannel) {
            request.responseChannel = `${this.getName()}_response`;
        }
        log.info('ping');
        event.reply(request.responseChannel, 'pong');
    }
}
