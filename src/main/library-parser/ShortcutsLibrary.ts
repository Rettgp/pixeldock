/* eslint-disable no-bitwise */
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';
import { getKey, parseBinaryVdf, BinaryVdfObject } from './BinaryVdfParser';
import {
    findGridImage,
    getSteamUsers,
    ICON_EXTENSIONS,
    SteamUser,
} from './SteamPaths';
import { Runnable } from '../types';

// Steam stores shortcut appids as signed int32; grid artwork and launch ids
// use the unsigned value.
export function toUnsignedAppId(appid: number): number {
    return appid >>> 0;
}

export function shortcutLaunchUrl(unsignedAppId: number): string {
    const gameId = (BigInt(unsignedAppId) << BigInt(32)) | BigInt(0x02000000);
    return `steam://rungameid/${gameId.toString()}`;
}

export default class ShortcutsLibrary {
    getGames(steamRoot: string): Runnable[] {
        if (!steamRoot) return [];

        const games = new Map<string, Runnable>();
        getSteamUsers(steamRoot).forEach((user) => {
            this.readShortcuts(user).forEach((game) => {
                if (!games.has(game.appid)) games.set(game.appid, game);
            });
        });
        return [...games.values()];
    }

    private readShortcuts(user: SteamUser): Runnable[] {
        const vdfPath = path.join(user.configDir, 'shortcuts.vdf');
        let root: BinaryVdfObject;
        try {
            root = parseBinaryVdf(fs.readFileSync(vdfPath));
        } catch (e: any) {
            if (e.code !== 'ENOENT') {
                log.warn(
                    `ShortcutsLibrary : Failed to read ${vdfPath}: ${e.message}`,
                );
            }
            return [];
        }

        const shortcuts = (getKey(root, 'shortcuts') ?? {}) as BinaryVdfObject;
        return Object.values(shortcuts)
            .filter(
                (entry): entry is BinaryVdfObject => typeof entry === 'object',
            )
            .filter((entry) => Number(getKey(entry, 'IsHidden') ?? 0) === 0)
            .map((entry) => {
                const rawAppId = Number(getKey(entry, 'appid'));
                const name = String(getKey(entry, 'AppName') ?? '').trim();
                if (!Number.isFinite(rawAppId) || !name) return null;

                const appid = toUnsignedAppId(rawAppId);
                return {
                    name,
                    appid: String(appid),
                    heroPath: findGridImage(user, [
                        `${appid}_hero`,
                        `${appid}`,
                    ]),
                    logoPath: findGridImage(user, [`${appid}_logo`]),
                    iconPath: findGridImage(
                        user,
                        [`${appid}_icon`],
                        ICON_EXTENSIONS,
                    ),
                    exe: shortcutLaunchUrl(appid),
                    nonSteam: true,
                } as Runnable;
            })
            .filter((game): game is Runnable => game !== null);
    }
}
