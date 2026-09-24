/* eslint-disable class-methods-use-this */
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';
import { parseManifest } from './SteamManifestParser';
import {
    findGridImage,
    ICON_EXTENSIONS,
    IMAGE_EXTENSIONS,
    SteamUser,
} from './SteamPaths';
import { Runnable, LibraryConnector } from '../types';

// Installed "apps" that are not games
const NON_GAME_APP_IDS = new Set(['228980']); // Steamworks Common Redistributables

const versioned = (url: string, filePath: string): string => {
    try {
        return `${url}?v=${Math.floor(fs.statSync(filePath).mtimeMs)}`;
    } catch {
        return url;
    }
};

export default class SteamLibrary implements LibraryConnector {
    getGames(
        appDirectory: string,
        imageDirectory: string = '',
        users: SteamUser[] = [],
    ): Runnable[] {
        let manifestPaths = [];
        try {
            manifestPaths = fs
                .readdirSync(appDirectory)
                .filter((file) => /^appmanifest_\d+\.acf$/.test(file))
                .map((file) => path.join(appDirectory, file));
        } catch (error) {
            log.error('SteamLibrary : Error reading directory:', error);
            return [];
        }

        const steamGames = manifestPaths.map((manifestPath) => {
            try {
                return parseManifest(manifestPath);
            } catch (e: any) {
                log.error(`Error parsing ${manifestPath} : ${e.message}`);
                return { appid: '0', name: '', installed: false };
            }
        });

        return steamGames
            .filter((game) => game.installed)
            .filter((game) => !NON_GAME_APP_IDS.has(game.appid))
            .map((game) => {
                return {
                    name: game.name,
                    appid: game.appid,
                    heroPath:
                        this.findCustomImage(users, game.appid, '_hero') ||
                        this.findHeroPath(imageDirectory, game.appid),
                    logoPath:
                        this.findCustomImage(users, game.appid, '_logo') ||
                        this.findLogoPath(imageDirectory, game.appid),
                    iconPath:
                        this.findCustomImage(
                            users,
                            game.appid,
                            '_icon',
                            ICON_EXTENSIONS,
                        ) || this.findIconPath(imageDirectory, game.appid),
                    exe: `steam://rungameid/${game.appid}`,
                } as Runnable;
            });
    }

    // Artwork set through Steam's "Set Custom Artwork" or SGDBoop overrides
    // the default library cache image.
    findCustomImage(
        users: SteamUser[],
        appid: string,
        suffix: string,
        extensions: string[] = IMAGE_EXTENSIONS,
    ): string {
        return (
            users
                .map((user) =>
                    findGridImage(user, [`${appid}${suffix}`], extensions),
                )
                .find(Boolean) ?? ''
        );
    }

    // Steam's client icon is the sha1-named jpg in librarycache/<appid>
    findIconPath(directory: string, appid: string): string {
        if (!directory) return '';
        const rootDir = path.join(directory, appid);
        try {
            const icon = fs
                .readdirSync(rootDir)
                .find((file) => /^[0-9a-f]{40}\.jpg$/i.test(file));
            if (!icon) return '';
            return versioned(
                `steamimages://image/${appid}/${icon}`,
                path.join(rootDir, icon),
            );
        } catch {
            return '';
        }
    }

    findHeroPath(directory: string, appid: string): string {
        return this.findCacheImage(directory, appid, 'library_hero.jpg');
    }

    findLogoPath(directory: string, appid: string): string {
        return this.findCacheImage(directory, appid, 'logo.png');
    }

    // Steam keeps each image either directly in librarycache/<appid> or in a
    // hashed subfolder of it.
    findCacheImage(directory: string, appid: string, fileName: string): string {
        if (!directory) return '';
        const rootDir = path.join(directory, appid);

        try {
            const entries = fs.readdirSync(rootDir, { withFileTypes: true });

            const relative = entries.some(
                (entry) => entry.isFile() && entry.name === fileName,
            )
                ? fileName
                : entries
                      .filter((entry) => entry.isDirectory())
                      .map((dir) => path.join(dir.name, fileName))
                      .find((rel) => fs.existsSync(path.join(rootDir, rel)));

            if (!relative) return '';
            const urlPath = path.join(appid, relative).replace(/\\/g, '/');
            return versioned(
                `steamimages://image/${urlPath}`,
                path.join(rootDir, relative),
            );
        } catch (e: any) {
            log.warn(`Error finding ${fileName}: ${e.message}`);
            return '';
        }
    }
}
