import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';
import { parseTextVdf, TextVdfObject } from './TextVdfParser';

export interface SteamUser {
    accountId: string;
    configDir: string;
    gridDir: string;
}

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
// SGDBoop can also save icons as .ico
export const ICON_EXTENSIONS = [...IMAGE_EXTENSIONS, '.ico'];

const isDirectory = (dir: string): boolean => {
    try {
        return fs.statSync(dir).isDirectory();
    } catch {
        return false;
    }
};

// <Steam>\appcache\librarycache -> <Steam>
export function steamRootFromCache(cachePath: string): string {
    if (!cachePath) return '';
    return path.resolve(cachePath, '..', '..');
}

export function getSteamUsers(steamRoot: string): SteamUser[] {
    const userdata = path.join(steamRoot, 'userdata');
    let entries: fs.Dirent[] = [];
    try {
        entries = fs.readdirSync(userdata, { withFileTypes: true });
    } catch {
        return [];
    }

    return entries
        .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
        .map((entry) => {
            const configDir = path.join(userdata, entry.name, 'config');
            return {
                accountId: entry.name,
                configDir,
                gridDir: path.join(configDir, 'grid'),
            };
        })
        .filter((user) => isDirectory(user.configDir));
}

export function readLibraryFolders(steamRoot: string): string[] {
    const vdfPath = path.join(steamRoot, 'steamapps', 'libraryfolders.vdf');
    let content = '';
    try {
        content = fs.readFileSync(vdfPath, 'utf-8');
    } catch {
        return [];
    }

    try {
        const vdf = parseTextVdf(content);
        const folders = (vdf.libraryfolders ?? {}) as TextVdfObject;
        return Object.values(folders)
            .map((folder) =>
                typeof folder === 'object' ? folder.path : undefined,
            )
            .filter((p): p is string => typeof p === 'string' && p.length > 0)
            .map((p) => path.join(p, 'steamapps'));
    } catch (e: any) {
        log.warn(`SteamPaths : Failed to parse ${vdfPath}: ${e.message}`);
        return [];
    }
}

// Every steamapps directory to scan: the configured one plus every library
// Steam knows about, deduped (Windows paths are case-insensitive).
export function getLibraryAppDirs(
    steamGamesLibrary: string,
    steamLibraryCache: string,
): string[] {
    const candidates = [steamGamesLibrary];
    const steamRoot = steamRootFromCache(steamLibraryCache);
    if (steamRoot) {
        candidates.push(...readLibraryFolders(steamRoot));
    }

    const seen = new Set<string>();
    return candidates
        .filter(Boolean)
        .map((dir) => path.resolve(dir))
        .filter((dir) => {
            const key = dir.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return isDirectory(dir);
        });
}

// Finds `<gridDir>/<base><ext>` for the first matching base name and returns
// a `steamgrid://` url with the file's mtime to bust the renderer cache.
export function findGridImage(
    user: SteamUser,
    baseNames: string[],
    extensions: string[] = IMAGE_EXTENSIONS,
): string {
    let files: string[];
    try {
        files = fs.readdirSync(user.gridDir);
    } catch {
        return '';
    }
    const lookup = new Map(files.map((f) => [f.toLowerCase(), f]));

    const file = baseNames
        .flatMap((base) =>
            extensions.map((ext) => `${base}${ext}`.toLowerCase()),
        )
        .map((name) => lookup.get(name))
        .find(Boolean);
    if (!file) return '';

    let version = 0;
    try {
        version = Math.floor(
            fs.statSync(path.join(user.gridDir, file)).mtimeMs,
        );
    } catch {
        // keep version 0
    }
    return `steamgrid://image/${user.accountId}/${encodeURIComponent(file)}?v=${version}`;
}
