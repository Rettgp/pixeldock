/* eslint-disable class-methods-use-this */
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';
import { parseManifest } from './SteamManifestParser';
import { Runnable, LibraryConnector } from '../types';

export default class SteamLibrary implements LibraryConnector {
    getGames(appDirectory: string, imageDirectory: string = ''): Runnable[] {
        let manifestPaths = [];
        try {
            manifestPaths = fs
                .readdirSync(appDirectory)
                .filter((file) => file.endsWith('.acf'))
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
            .map((game) => {
                return {
                    name: game.name,
                    appid: game.appid,
                    heroPath: this.findHeroPath(imageDirectory, game.appid),
                    exe: `steam://rungameid/${game.appid}`,
                } as Runnable;
            });
    }

    findHeroPath(directory: string, appid: string): string {
        const basePath = directory;
        const rootDir = path.join(basePath, appid);

        try {
            const entries = fs.readdirSync(rootDir, { withFileTypes: true });

            const inRoot = entries.find(
                (entry) => entry.isFile() && entry.name === 'library_hero.jpg',
            );
            if (inRoot) {
                path.join(basePath, appid);
                let heroPath = path
                    .join(appid, inRoot.name)
                    .replace(/\\/g, '/');
                heroPath = `steamimages://image/${heroPath}`;
                return heroPath;
            }

            const inSubdir = entries
                .filter((entry) => entry.isDirectory())
                .map((dir) => {
                    const subPath = path.join(
                        rootDir,
                        dir.name,
                        'library_hero.jpg',
                    );
                    if (fs.existsSync(subPath)) {
                        return path
                            .join(appid, dir.name, 'library_hero.jpg')
                            .replace(/\\/g, '/');
                    }
                    return null;
                })
                .find(Boolean);

            const heroPath = inSubdir ? `steamimages://image/${inSubdir}` : '';
            return heroPath;
        } catch (e: any) {
            log.warn(`Error finding library_hero: ${e.message}`);
            return '';
        }
    }
}
