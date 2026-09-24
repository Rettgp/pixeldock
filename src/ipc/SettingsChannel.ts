import { IpcMainEvent } from 'electron';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';
import { IpcChannelInterface, IpcRequest } from './IpcChannelInterface';
import SettingsService from '../main/SettingsService';
import { Settings } from '../main/StorageType';
import { validateSetup } from '../main/SteamSetupValidator';
import { listDisplays } from '../main/window';

const DEFAULT_STEAM_ROOT = 'C:\\Program Files (x86)\\Steam';

function readSteamPathFromRegistry(): Promise<string> {
    if (process.platform !== 'win32') return Promise.resolve('');
    return new Promise((resolve) => {
        execFile(
            'reg',
            ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'],
            { windowsHide: true },
            (error, stdout) => {
                if (error) {
                    resolve('');
                    return;
                }
                const match = stdout.match(/SteamPath\s+REG_SZ\s+(.+)/);
                resolve(match ? path.normalize(match[1].trim()) : '');
            },
        );
    });
}

async function detectSteamPaths() {
    const registryRoot = await readSteamPathFromRegistry();
    const root = [registryRoot, DEFAULT_STEAM_ROOT].find(
        (candidate) => candidate && fs.existsSync(candidate),
    );
    if (!root) return { steamLibraryCache: '', steamGamesLibrary: '' };

    const cache = path.join(root, 'appcache', 'librarycache');
    const apps = path.join(root, 'steamapps');
    return {
        steamLibraryCache: fs.existsSync(cache) ? cache : '',
        steamGamesLibrary: fs.existsSync(apps) ? apps : '',
    };
}

export default class SettingsChannel implements IpcChannelInterface {
    static name: string = 'settings';

    private settingsService: SettingsService;

    private onSaved: (settings: Settings) => void;

    constructor(
        settingsService: SettingsService,
        onSaved: (settings: Settings) => void = () => {},
    ) {
        this.settingsService = settingsService;
        this.onSaved = onSaved;
    }

    getName(): string {
        return SettingsChannel.name;
    }

    async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
        if (!request.responseChannel) {
            request.responseChannel = `${this.getName()}_response`;
        }
        if (!request.params) {
            return;
        }
        const reply = (response: any) =>
            event.reply(request.responseChannel!, response);

        try {
            switch (request.params[0]) {
                case 'fetch':
                    reply(await this.settingsService.fetchSettings());
                    break;
                case 'validate': {
                    const [, cache, games] = request.params;
                    reply(validateSetup(cache ?? '', games ?? ''));
                    break;
                }
                case 'detect':
                    reply(await detectSteamPaths());
                    break;
                case 'displays':
                    reply(listDisplays());
                    break;
                case 'save': {
                    const settingsJson = JSON.parse(request.params[1]);
                    const existing = await this.settingsService.fetchSettings();
                    const result = await this.settingsService.saveSettings({
                        // Always update the single stored settings document
                        // eslint-disable-next-line no-underscore-dangle
                        id: existing._id ?? '0',
                        display: settingsJson.display,
                        steamLibraryCache: settingsJson.steamLibraryCache,
                        steamGamesLibrary: settingsJson.steamGamesLibrary,
                    });
                    reply(result);
                    this.onSaved(await this.settingsService.fetchSettings());
                    break;
                }
                default:
                    break;
            }
        } catch (error: any) {
            log.error(error);
            reply({ ok: false, error: error?.message ?? String(error) });
        }
    }
}
