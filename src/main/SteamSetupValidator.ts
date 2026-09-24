import * as fs from 'fs';
import * as path from 'path';
import {
    getLibraryAppDirs,
    getSteamUsers,
    steamRootFromCache,
} from './library-parser/SteamPaths';

export interface PathValidation {
    ok: boolean;
    message: string;
    count: number;
}

export interface SetupValidation {
    steamLibraryCache: PathValidation;
    steamGamesLibrary: PathValidation;
    libraryFolders: string[];
    valid: boolean;
}

const readDir = (dir: string): fs.Dirent[] | null => {
    try {
        return fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return null;
    }
};

export function validateLibraryCache(cachePath: string): PathValidation {
    if (!cachePath) {
        return {
            ok: false,
            message: 'Choose your Steam library cache folder.',
            count: 0,
        };
    }
    const entries = readDir(cachePath);
    if (!entries) {
        return { ok: false, message: 'This folder does not exist.', count: 0 };
    }
    if (
        path.basename(path.dirname(path.resolve(cachePath))).toLowerCase() !==
        'appcache'
    ) {
        return {
            ok: false,
            message: 'Expected a folder like …\\Steam\\appcache\\librarycache',
            count: 0,
        };
    }
    const count = entries.filter(
        (entry) => entry.isDirectory() && /^\d+$/.test(entry.name),
    ).length;
    const users = getSteamUsers(steamRootFromCache(cachePath)).length;
    return {
        ok: true,
        message: `${count} artwork folders · ${users} Steam ${users === 1 ? 'account' : 'accounts'}`,
        count,
    };
}

export function validateGamesLibrary(appsPath: string): PathValidation {
    if (!appsPath) {
        return {
            ok: false,
            message: 'Choose your steamapps folder.',
            count: 0,
        };
    }
    const entries = readDir(appsPath);
    if (!entries) {
        return { ok: false, message: 'This folder does not exist.', count: 0 };
    }
    const count = entries.filter((entry) =>
        /^appmanifest_\d+\.acf$/.test(entry.name),
    ).length;
    if (count === 0) {
        return {
            ok: false,
            message:
                'No installed games found. Expected a folder like …\\SteamLibrary\\steamapps',
            count: 0,
        };
    }
    return {
        ok: true,
        message: `Found ${count} ${count === 1 ? 'game' : 'games'}`,
        count,
    };
}

export function validateSetup(
    steamLibraryCache: string,
    steamGamesLibrary: string,
): SetupValidation {
    const cache = validateLibraryCache(steamLibraryCache);
    const games = validateGamesLibrary(steamGamesLibrary);
    return {
        steamLibraryCache: cache,
        steamGamesLibrary: games,
        libraryFolders: getLibraryAppDirs(steamGamesLibrary, steamLibraryCache),
        valid: cache.ok && games.ok,
    };
}
