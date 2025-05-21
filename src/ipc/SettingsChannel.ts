import { IpcMainEvent } from 'electron';
import log from 'electron-log/renderer';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';
import { fetchSettings, saveSettings } from '../main/SettingsService';

export default class SettingsChannel implements IpcChannelInterface {
    static name: string = 'settings';

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
            fetchSettings()
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
            };
            saveSettings(settings)
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
