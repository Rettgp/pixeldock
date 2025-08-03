import { IpcMainEvent } from 'electron';
import log from 'electron-log/renderer';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';
import SettingsService from '../main/SettingsService';
import { createSettingsDb } from '../main/StorageType';

export default class SettingsChannel implements IpcChannelInterface {
    static name: string = 'settings';

    private settingsService: SettingsService;

    constructor();

    constructor(settingsService: SettingsService);

    constructor(settingsService?: SettingsService) {
        this.settingsService =
            settingsService ?? new SettingsService(createSettingsDb());
    }

    getName(): string {
        return SettingsChannel.name;
    }

    handle(event: IpcMainEvent, request: IpcRequest): void {
        if (!request.responseChannel) {
            request.responseChannel = `${this.getName()}_response`;
        }
        if (!request.params) {
            return;
        }

        if (request.params![0] === 'fetch') {
            this.settingsService
                .fetchSettings()
                .then((settings) => {
                    event.reply(request.responseChannel!, settings);
                    return settings;
                })
                .catch((error) => {
                    log.error(error);
                });
        }

        if (request.params![0] === 'save') {
            const settingsJson = JSON.parse(request.params![1]);
            const settings = {
                // eslint-disable-next-line no-underscore-dangle
                id: settingsJson._id,
                display: settingsJson.display,
                steamLibraryCache: settingsJson.steamLibraryCache,
                steamGamesLibrary: settingsJson.steamGamesLibrary,
            };
            this.settingsService
                .saveSettings(settings)
                .then((result) => {
                    event.reply(request.responseChannel!, result);

                    return result;
                })

                .catch((error) => {
                    log.error(error);
                });
        }
    }
}
