import IpcService from '../ipc/IpcService';
import type { IpcRequest } from '../ipc/IpcChannelInterface';
import type { Settings } from '../main/StorageType';
import type { SetupValidation } from '../main/SteamSetupValidator';
import type { DisplayOption } from '../main/window';
import type { Runnable } from '../main/types';

export type { Settings, SetupValidation, DisplayOption, Runnable };

export interface SteamPaths {
    steamLibraryCache: string;
    steamGamesLibrary: string;
}

const ipc = new IpcService();

export const LIBRARY_UPDATED = 'library-updated';

export const api = {
    getGames: () =>
        ipc.send<Runnable[]>('game-library', { params: ['getGames'] }),
    refreshLibrary: () =>
        ipc.send<boolean>('game-library', { params: ['refresh'] }),
    playGame: (exe: string) =>
        ipc.send<void>('game-library', { params: ['playGame', exe] }),
    fetchSettings: () => ipc.send<Settings>('settings', { params: ['fetch'] }),
    saveSettings: (settings: Partial<Settings>) =>
        ipc.send<{ ok: boolean }>('settings', {
            params: ['save', JSON.stringify(settings)],
        }),
    validate: (paths: SteamPaths) =>
        ipc.send<SetupValidation>('settings', {
            params: [
                'validate',
                paths.steamLibraryCache,
                paths.steamGamesLibrary,
            ],
        }),
    detectPaths: () => ipc.send<SteamPaths>('settings', { params: ['detect'] }),
    listDisplays: () =>
        ipc.send<DisplayOption[]>('settings', { params: ['displays'] }),
    browseDirectory: () =>
        ipc.send<string | null>('open-file', { params: ['openDirectory'] }),
    listen: (channel: string, callback: (request: IpcRequest) => void) =>
        ipc.listen(channel, callback),
};
