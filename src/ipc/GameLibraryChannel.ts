import { IpcMainEvent } from 'electron';
import log from 'electron-log/renderer';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';
import SteamLibrary from '../main/library-parser/SteamLibrary';
import spawnGame from '../process/spawnGame';
import SettingsService from '../main/SettingsService';

export default class GameLibraryChannel implements IpcChannelInterface {
    static name: string = 'game-library';

    private settingsService: SettingsService;

    constructor(settingsService: SettingsService) {
        this.settingsService = settingsService;
    }

    getName(): string {
        return GameLibraryChannel.name;
    }

    async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
        if (!request.responseChannel) {
            request.responseChannel = `${this.getName()}_response`;
        }
        if (!request.params) {
            return;
        }

        if (request.params![0] === 'getGames') {
            const settings = await this.settingsService.fetchSettings();
            const steamLibrary = new SteamLibrary();
            const runnables = steamLibrary.getGames(
                settings.steamGamesLibrary || '',
                settings.steamLibraryCache || '',
            );
            event.reply(request.responseChannel!, runnables);
        }

        if (request.params![0] === 'playGame') {
            if (request.params.length > 1) {
                spawnGame(request.params[1]);
            }
        }
    }
}
