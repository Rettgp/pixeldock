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
import SettingsService from '../../src/main/SettingsService';
import { Settings } from '../../src/main/StorageType';

PouchDB.plugin(memoryAdapter);
setDefaultTimeout(5000);

let testResult: any;
let settingsDB: PouchDB.Database<Settings>;
let settingsService: SettingsService;

Before(async () => {
    if (settingsDB) {
        await settingsDB.destroy();
    }
    settingsDB = new PouchDB<Settings>('settings-test', { adapter: 'memory' });
    settingsService = new SettingsService(settingsDB);
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

Then('the preferred monitor should be null', () => {
    assert.strictEqual(testResult, null);
});

Then('the preferred monitor should be {string}', (monitor: string) => {
    assert.strictEqual(testResult, monitor);
});

When(
    'I save only the Steam paths {string} and {string}',
    async (cache: string, games: string) => {
        const existing = await settingsService.fetchSettings();
        await settingsService.saveSettings({
            // eslint-disable-next-line no-underscore-dangle
            id: existing._id,
            display: undefined,
            steamLibraryCache: cache,
            steamGamesLibrary: games,
        });
        const updated = await settingsService.fetchSettings();
        testResult = updated.display ? `Monitor ${updated.display}` : null;
    },
);

Then(
    'the stored Steam paths should be {string} and {string}',
    async (cache: string, games: string) => {
        const settings = await settingsService.fetchSettings();
        assert.strictEqual(settings.steamLibraryCache, cache);
        assert.strictEqual(settings.steamGamesLibrary, games);
    },
);
