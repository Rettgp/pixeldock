/* eslint-disable class-methods-use-this */
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';
import { parseManifest } from './SteamManifestParser';
import { Runnable, LibraryConnector } from '../types';

export default class SteamLibrary implements LibraryConnector {
    getGames(directory: string): Runnable[] {
        let manifestPaths = [];
        try {
            manifestPaths = fs
                .readdirSync(directory)
                .filter((file) => file.endsWith('.acf'))
                .map((file) => path.join(directory, file));
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
                    heroPath: '',
                    exe: `steam://rungameid/${game.appid}`,
                } as Runnable;
            });
    }
}
