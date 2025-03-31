/* eslint-disable max-classes-per-file */
import * as fs from 'fs';
import log from 'electron-log/main';
import SteamGame from './SteamGame';

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
    const lines = content.split(/\r?\n/).map((line) => line.trim());
    const stack: any[] = [{}];
    let currentKey = '';

    lines.forEach((line) => {
        if (line === '{') {
            const newObj = {};
            stack[stack.length - 1][currentKey] = newObj;
            stack.push(newObj);
        } else if (line !== '}') {
            const match = line.match(/"(.*?)"\s+"(.*?)"/);
            if (match) {
                const [, key, value] = match;
                stack[stack.length - 1][key] = value;
            } else {
                const keyMatch = line.match(/"(.*?)"/);
                if (keyMatch) {
                    [, currentKey] = keyMatch;
                }
            }
        }
    });

    if (stack[0].appid === undefined) throw new InvalidAppId(stack[0].appid);
    if (stack[0].name === undefined) throw new InvalidName(stack[0].name);
    if (stack[0].StateFlags === undefined)
        throw new InvalidState(stack[0].StateFlags);

    return {
        appid: stack[0].appid,
        name: stack[0].name,
        installed: stack[0].StateFlags === '4',
    } as SteamGame;
}

export function parseManifest(path: string): SteamGame {
    let content = '';
    try {
        content = fs.readFileSync(path, 'utf-8');
    } catch (e: any) {
        log.error(`Manifest file not found : ${e.message}`);
        return { appid: '0', name: 'UNKNOWN', installed: false } as SteamGame;
    }

    return createGameFromAcf(content);
}
