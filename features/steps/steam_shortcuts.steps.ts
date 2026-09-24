/* eslint-disable func-names */
import { After, Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import mockFs from 'mock-fs';
import path from 'path';
import {
    parseBinaryVdf,
    getKey,
    BinaryVdfObject,
} from '../../src/main/library-parser/BinaryVdfParser';
import ShortcutsLibrary, {
    toUnsignedAppId,
} from '../../src/main/library-parser/ShortcutsLibrary';
import { getLibraryAppDirs } from '../../src/main/library-parser/SteamPaths';
import { Runnable } from '../../src/main/types';

// --- Binary VDF writer used to build fixtures ---
const str = (key: string, value: string) =>
    Buffer.concat([
        Buffer.from([0x01]),
        Buffer.from(`${key}\0${value}\0`, 'utf8'),
    ]);
const int = (key: string, value: number) => {
    const n = Buffer.alloc(4);
    n.writeInt32LE(value);
    return Buffer.concat([Buffer.from([0x02]), Buffer.from(`${key}\0`), n]);
};
const map = (key: string, children: Buffer[]) =>
    Buffer.concat([
        Buffer.from([0x00]),
        Buffer.from(`${key}\0`),
        ...children,
        Buffer.from([0x08]),
    ]);

interface ShortcutRow {
    name: string;
    appid: number;
    hidden: number;
    lowercase?: boolean;
}

function shortcutsFile(rows: ShortcutRow[]): Buffer {
    const entries = rows.map((row, index) =>
        map(String(index), [
            int('appid', row.appid),
            str(row.lowercase ? 'appname' : 'AppName', row.name),
            str('Exe', `"C:\\Games\\${row.name}.exe"`),
            int('IsHidden', row.hidden),
            map('tags', [str('0', 'VR')]),
        ]),
    );
    return Buffer.concat([map('shortcuts', entries), Buffer.from([0x08])]);
}

let binary: Buffer;
let parsed: BinaryVdfObject;
let parseError: Error | null;
let shortcuts: Runnable[];
let libraryDirs: string[];
let configuredLibrary: string;
const steamRoot = 'steam-root';
let fsLayout: Record<string, any>;

After(() => mockFs.restore());

// --- Binary VDF ---
Given(
    'a binary shortcuts file with a shortcut named {string} and appid {int}',
    function (name: string, appid: number) {
        binary = shortcutsFile([
            { name, appid, hidden: 0, lowercase: name === 'Old Game' },
        ]);
    },
);

Given('a truncated binary file', function () {
    binary = Buffer.from([0x00, 0x73, 0x00, 0x01, 0x6b]);
});

When('I parse the binary file', function () {
    parseError = null;
    try {
        parsed = parseBinaryVdf(binary);
    } catch (e: any) {
        parseError = e;
    }
});

const shortcutAt = (index: string) =>
    (parsed.shortcuts as BinaryVdfObject)[index] as BinaryVdfObject;

Then(
    'shortcut {string} should have {string} equal to {string}',
    function (index: string, key: string, value: string) {
        assert.strictEqual(getKey(shortcutAt(index), key), value);
    },
);

Then(
    'shortcut {string} should have unsigned appid {float}',
    function (index: string, expected: number) {
        assert.strictEqual(
            toUnsignedAppId(getKey(shortcutAt(index), 'appid')),
            expected,
        );
    },
);

Then('parsing should throw {string}', function (name: string) {
    assert.ok(parseError, 'expected an error');
    assert.match(parseError!.message, new RegExp(name));
});

// --- Shortcuts library ---
Given('a Steam install with shortcuts:', function (dataTable) {
    const byAccount: Record<string, ShortcutRow[]> = {};
    dataTable.hashes().forEach((row: any) => {
        byAccount[row.account] = byAccount[row.account] ?? [];
        byAccount[row.account].push({
            name: row.name,
            appid: Number(row.appid),
            hidden: Number(row.hidden),
        });
    });
    fsLayout = {};
    Object.entries(byAccount).forEach(([account, rows]) => {
        fsLayout[path.join(steamRoot, 'userdata', account, 'config')] = {
            'shortcuts.vdf': shortcutsFile(rows),
        };
    });
});

Given(
    'grid images {string} for account {string}',
    function (files: string, account: string) {
        const grid: Record<string, string> = {};
        files.split(',').forEach((file) => {
            grid[file.trim()] = 'img';
        });
        fsLayout[path.join(steamRoot, 'userdata', account, 'config', 'grid')] =
            grid;
    },
);

When('the shortcuts are loaded', function () {
    mockFs(fsLayout);
    shortcuts = new ShortcutsLibrary().getGames(steamRoot);
    mockFs.restore();
});

When('shortcuts are loaded from a missing Steam folder', function () {
    mockFs({});
    shortcuts = new ShortcutsLibrary().getGames('nowhere');
    mockFs.restore();
});

Then('the result should contain {int} shortcuts', function (count: number) {
    assert.strictEqual(shortcuts.length, count);
});

const byName = (name: string) => {
    const game = shortcuts.find((g) => g.name === name);
    assert.ok(game, `Missing shortcut ${name}`);
    return game!;
};

Then(
    'shortcut {string} should launch {string}',
    function (name: string, url: string) {
        assert.strictEqual(byName(name).exe, url);
    },
);

Then(
    'shortcut {string} should use artwork {string}',
    function (name: string, file: string) {
        assert.match(
            byName(name).heroPath,
            new RegExp(
                `^steamgrid://image/\\d+/${file.replace('.', '\\.')}\\?v=\\d+$`,
            ),
        );
    },
);

Then(
    'shortcut {string} should use logo {string}',
    function (name: string, file: string) {
        assert.match(
            byName(name).logoPath,
            new RegExp(
                `^steamgrid://image/\\d+/${file.replace('.', '\\.')}\\?v=\\d+$`,
            ),
        );
    },
);

Then('shortcut {string} should have no logo', function (name: string) {
    assert.strictEqual(byName(name).logoPath, '');
});

Then(
    'shortcut {string} should use icon {string}',
    function (name: string, file: string) {
        assert.match(
            byName(name).iconPath,
            new RegExp(
                `^steamgrid://image/\\d+/${file.replace('.', '\\.')}\\?v=\\d+$`,
            ),
        );
    },
);

Then('shortcut {string} should have no icon', function (name: string) {
    assert.strictEqual(byName(name).iconPath, '');
});

Then('shortcut {string} should have no artwork', function (name: string) {
    assert.strictEqual(byName(name).heroPath, '');
});

// --- Library folders ---
Given(
    'a Steam install at {string} with library folders {string}',
    function (root: string, folders: string) {
        const entries = folders
            .split(',')
            .map((folder, index) => {
                // libraryfolders.vdf escapes backslashes
                const abs = path.resolve(folder.trim()).replace(/\\/g, '\\\\');
                return `\t"${index}"\n\t{\n\t\t"path"\t\t"${abs}"\n\t}`;
            })
            .join('\n');
        fsLayout = {
            [path.join(root, 'steamapps')]: {
                'libraryfolders.vdf': `"libraryfolders"\n{\n${entries}\n}\n`,
            },
            [path.join(root, 'appcache', 'librarycache')]: {},
        };
        folders
            .split(',')
            .map((f) => f.trim())
            .filter((f) => f !== root && f !== 'missing')
            .forEach((folder) => {
                fsLayout[path.join(folder, 'steamapps')] = {};
            });
    },
);

Given('a configured game library {string}', function (library: string) {
    configuredLibrary = library;
});

When('the library directories are resolved', function () {
    mockFs(fsLayout);
    libraryDirs = getLibraryAppDirs(
        configuredLibrary,
        path.join('steam', 'appcache', 'librarycache'),
    );
    mockFs.restore();
});

Then('the library directories should be {string}', function (expected: string) {
    assert.deepStrictEqual(
        libraryDirs,
        expected.split(',').map((dir) => path.resolve(dir.trim())),
    );
});
