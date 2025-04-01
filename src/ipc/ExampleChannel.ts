import { IpcMainEvent } from 'electron';
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
        console.log('ping');
        event.reply(request.responseChannel, 'pong');
    }
}
