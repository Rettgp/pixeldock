import SteamLibrary from './library-parser/SteamLibrary';
import ShortcutsLibrary from './library-parser/ShortcutsLibrary';
import {
    getLibraryAppDirs,
    getSteamUsers,
    steamRootFromCache,
} from './library-parser/SteamPaths';
import { Runnable } from './types';

export interface LibraryPaths {
    steamLibraryCache?: string;
    steamGamesLibrary?: string;
}

export default class LibraryService {
    private steamLibrary = new SteamLibrary();

    private shortcutsLibrary = new ShortcutsLibrary();

    getRunnables(paths: LibraryPaths): Runnable[] {
        const cache = paths.steamLibraryCache || '';
        const steamRoot = steamRootFromCache(cache);
        const users = steamRoot ? getSteamUsers(steamRoot) : [];

        const games = new Map<string, Runnable>();
        getLibraryAppDirs(paths.steamGamesLibrary || '', cache).forEach(
            (dir) => {
                this.steamLibrary
                    .getGames(dir, cache, users)
                    .forEach((game) => {
                        if (!games.has(game.appid)) games.set(game.appid, game);
                    });
            },
        );
        this.shortcutsLibrary.getGames(steamRoot).forEach((game) => {
            if (!games.has(game.appid)) games.set(game.appid, game);
        });

        return [...games.values()].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        );
    }
}
