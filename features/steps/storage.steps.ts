/* eslint-disable func-names */
import {
    Given,
    When,
    Then,
    setDefaultTimeout,
    Before,
} from '@cucumber/cucumber';
import assert from 'assert';
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';
import StorageService from '../../src/main/CustomGameService';
import SettingsService from '../../src/main/SettingsService';
import { CustomGame, Settings } from '../../src/main/StorageType';

PouchDB.plugin(memoryAdapter);
setDefaultTimeout(5000);

let testResult: any;
let thrownError: Error | null = null;
let memoryDB: PouchDB.Database<CustomGame>;
let settingsDB: PouchDB.Database<Settings>;
let storageService: StorageService;
let settingsService: SettingsService;

Before(async () => {
    if (memoryDB) {
        await memoryDB.destroy();
    }
    if (settingsDB) {
        await settingsDB.destroy();
    }
    memoryDB = new PouchDB<CustomGame>('test', { adapter: 'memory' });
    settingsDB = new PouchDB<Settings>('settings-test', { adapter: 'memory' });
    storageService = new StorageService(memoryDB);
    settingsService = new SettingsService(settingsDB);
});

When('I add a game with:', async function (dataTable) {
    const game = dataTable.rowsHash();
    thrownError = null;
    try {
        testResult = await storageService.addGame(game);
    } catch (err: any) {
        thrownError = err;
    }
});

Then(
    'the database should contain the game with id {string}',
    async (id: string) => {
        const doc = await memoryDB.get(id);
        assert.ok(doc);
        // eslint-disable-next-line no-underscore-dangle
        assert.strictEqual(doc._id, id);
    },
);

Then('the operation should fail with message {string}', (msg: string) => {
    assert.ok(thrownError);
    assert.strictEqual(thrownError.message, msg);
});

// Fetch Games
Given('the database has games:', async (dataTable) => {
    const games = dataTable.hashes().map((row: any) => ({
        _id: row.id,
        name: row.name,
        exe: row.exe,
        heroPath: row.heroPath,
    }));

    await memoryDB.bulkDocs(games);
});

Given('the database has no games', () => {});

When('I fetch games', async () => {
    testResult = await storageService.fetchGames();
});

Then('I should receive:', (dataTable) => {
    const expected = dataTable.hashes();
    const actual = (
        testResult as Array<{
            _id: string;
            name: string;
            exe: string;
            heroPath: string;
        }>
    ).map(({ _id, name, exe, heroPath }) => ({
        _id,
        name,
        exe,
        heroPath,
    }));

    assert.deepStrictEqual(actual, expected);
});

Then('I should receive an empty list', () => {
    assert.deepStrictEqual(testResult, []);
});

// Remove Game
Given('the game {string} exists in the database', async (id: string) => {
    const doc = { _id: id, name: 'Game One', exe: 'path1', heroPath: 'hero1' };
    await memoryDB.put(doc);
});

When('I remove the game {string}', async (id: string) => {
    testResult = await storageService.removeGame(id);
});

Then('the game should be removed successfully', () => {
    const { ok, id } = testResult;
    assert.deepStrictEqual({ ok, id }, { ok: true, id: 'game1' });
});

Then(
    'the operation should return failure for {string}',
    (expectedId: string) => {
        const { ok, id } = testResult;
        assert.deepStrictEqual({ ok, id }, { ok: false, expectedId });
    },
);

// Clear Games
Given('the database contains:', async (dataTable) => {
    const docs = dataTable.hashes().map((row: any) => ({
        _id: row.id,
        name: 'game',
        exe: '',
        heroPath: '',
    }));

    await memoryDB.bulkDocs(docs);
});

When('I clear all games', async () => {
    await storageService.clearAllGames();
});

Then('the deleted documents should be:', async (dataTable) => {
    // eslint-disable-next-line no-underscore-dangle
    const expected = dataTable.hashes().map((row: any) => row._id);
    await Promise.all(
        expected.map(async (id: string) => {
            try {
                await memoryDB.get(id);
                assert.fail(`Expected ${id} to be deleted`);
            } catch (err: any) {
                assert.strictEqual(err.status, 404);
            }
        }),
    );
});

Then('no bulk delete should occur', async () => {
    const result = await memoryDB.allDocs();
    assert.strictEqual(result.rows.length, 0);
});

// Preferred Monitor
Given('the database has no preferred monitor', () => {});

Given(
    'the database has a preferred monitor {string}',
    async (monitor: string) => {
        // Use the monitor number as a stand-in for a stable OS display id
        const id = parseInt(monitor.replace('Monitor ', ''), 10);
        await settingsService.saveSettings({
            id: '0',
            display: id,
            steamLibraryCache: '',
            steamGamesLibrary: '',
        });
    },
);

When('I fetch the preferred monitor', async () => {
    const settings = await settingsService.fetchSettings();
    // display === 0 means no preference stored (0 is never a valid OS display id)
    testResult = settings.display ? `Monitor ${settings.display}` : null;
});

When('I update the preferred monitor to {string}', async (monitor: string) => {
    const id = parseInt(monitor.replace('Monitor ', ''), 10);
    const existing = await settingsService.fetchSettings();
    await settingsService.saveSettings({
        // eslint-disable-next-line no-underscore-dangle
        id: existing._id ?? '0',
        display: id,
        steamLibraryCache: existing.steamLibraryCache ?? '',
        steamGamesLibrary: existing.steamGamesLibrary ?? '',
    });
    const updated = await settingsService.fetchSettings();
    testResult = updated.display ? `Monitor ${updated.display}` : null;
});

Then('the preferred monitor should be the primary monitor', () => {
    assert.strictEqual(testResult, null);
});

Then('the preferred monitor should be {string}', (monitor: string) => {
    assert.strictEqual(testResult, monitor);
});
