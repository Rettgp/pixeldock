import { IpcMainEvent } from 'electron';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';
import SteamLibrary from '../library-parser/SteamLibrary';
import spawnGame from '../process/spawnGame';

export default class GameLibraryChannel implements IpcChannelInterface {
    static name: string = 'game-library';

    getName(): string {
        return GameLibraryChannel.name;
    }

    handle(event: IpcMainEvent, request: IpcRequest): void {
        if (!request.responseChannel) {
            request.responseChannel = `${this.getName()}_response`;
        }
        console.log(request.params);
        if (!request.params) {
            return;
        }

        if (request.params![0] === 'getGames') {
            const steamLibrary = new SteamLibrary();
            const runnables = steamLibrary.getGames(
                'G:\\SteamLibrary\\steamapps', // TODO
            );
            console.log(request.responseChannel);
            event.reply(request.responseChannel!, runnables);
        }

        if (request.params![0] === 'playGame') {
            if (request.params.length > 1) {
                spawnGame(request.params[1]);
            }
        }
    }
}
