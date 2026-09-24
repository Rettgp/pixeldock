import { IpcMainEvent, shell } from 'electron';
import log from 'electron-log/main';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';
import SettingsService from '../main/SettingsService';
import LibraryService from '../main/LibraryService';

export default class GameLibraryChannel implements IpcChannelInterface {
    static name: string = 'game-library';

    private settingsService: SettingsService;

    private libraryService: LibraryService;

    private onRefresh: () => void;

    constructor(
        settingsService: SettingsService,
        libraryService: LibraryService,
        onRefresh: () => void = () => {},
    ) {
        this.settingsService = settingsService;
        this.libraryService = libraryService;
        this.onRefresh = onRefresh;
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
            event.reply(
                request.responseChannel!,
                this.libraryService.getRunnables(settings),
            );
        }

        if (request.params![0] === 'refresh') {
            this.onRefresh();
            event.reply(request.responseChannel!, true);
        }

        if (request.params![0] === 'playGame') {
            // Every game (including non-Steam shortcuts) launches through Steam
            const url = request.params[1] ?? '';
            if (/^steam:\/\/rungameid\/\d+$/.test(url)) {
                shell.openExternal(url).catch((error) => log.error(error));
            } else {
                log.warn(`Refusing to launch unexpected target: ${url}`);
            }
        }
    }
}
