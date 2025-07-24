import { IpcMainEvent } from 'electron';
import log from 'electron-log/renderer';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';
import { StorageService } from '../main/CustomGameService';
import { createCustomGameDb } from '../main/StorageType';

export default class CustomGamesChannel implements IpcChannelInterface {
    static name: string = 'custom-games';
    storageService: StorageService = new StorageService(createCustomGameDb());

    getName(): string {
        return CustomGamesChannel.name;
    }

    handle(event: IpcMainEvent, request: IpcRequest): void {
        if (!request.responseChannel) {
            request.responseChannel = `${this.getName()}_response`;
        }
        if (!request.params) {
            return;
        }

        if (request.params![0] === 'fetch') {
            this.storageService.fetchGames()
                .then((games) => {
                    event.reply(request.responseChannel!, games);
                    return games;
                })
                .catch((error) => {
                    log.error(error);
                });
        }

        if (request.params![0] === 'add') {
            const gameJson = JSON.parse(request.params![1]);
            const game = {
                // eslint-disable-next-line no-underscore-dangle
                id: gameJson._id,
                name: gameJson.name,
                exe: gameJson.exe,
                heroPath: gameJson.heroPath,
            };
            this.storageService.addGame(game)
                .then((result) => {
                    event.reply(request.responseChannel!, result);
                    return result;
                })
                .catch((error) => {
                    log.error(error);
                });
        }

        if (request.params![0] === 'remove') {
            const id = request.params![1];
            this.storageService.removeGame(id)
                .then((result) => {
                    return result;
                })
                .catch((error) => {
                    log.error(error);
                });
        }
    }
}
