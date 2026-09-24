/* eslint-disable max-classes-per-file */
import * as fs from 'fs';
import log from 'electron-log/main';
import { SteamGame } from '../types';
import { parseTextVdf } from './TextVdfParser';

export class InvalidAppId extends Error {
    constructor(appid: string) {
        super(`InvalidAppId : appid is invalid (${appid})`);
    }
}

export class InvalidName extends Error {
    constructor(name: string) {
        super(`InvalidName : name is invalid (${name})`);
    }
}

export class InvalidState extends Error {
    constructor(state: string) {
        super(`InvalidState : GameState is invalid (${state})`);
    }
}

function createGameFromAcf(content: string): SteamGame {
    const vdf: any = parseTextVdf(content);
    const appState = vdf.AppState ?? {};

    if (appState.appid === undefined) throw new InvalidAppId(appState.appid);
    if (appState.name === undefined) throw new InvalidName(appState.name);
    if (appState.StateFlags === undefined)
        throw new InvalidState(appState.StateFlags);

    return {
        appid: appState.appid,
        name: appState.name,
        installed: appState.StateFlags === '4',
    } as SteamGame;
}

export function parseManifest(path: string): SteamGame {
    let content = '';
    try {
        content = fs.readFileSync(path, 'utf-8');
    } catch (e: any) {
        log.warn(`Manifest file not found : ${e.message}`);
        return { appid: '0', name: 'UNKNOWN', installed: false } as SteamGame;
    }

    return createGameFromAcf(content);
}
