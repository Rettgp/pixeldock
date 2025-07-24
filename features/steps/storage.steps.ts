import { Given, When, Then, setDefaultTimeout, Before, After } from '@cucumber/cucumber';
import assert from 'assert';
import { StorageService } from '../../src/main/CustomGameService';
import { CustomGame } from '../../src/main/StorageType';
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';

PouchDB.plugin(memoryAdapter);
setDefaultTimeout(5000);

let testResult: any;
let thrownError: Error | null = null;
let memoryDB: PouchDB.Database<CustomGame>;
let storageService: StorageService;

Before(async () => {
  if (memoryDB) {
    await memoryDB.destroy();
  }
  memoryDB = new PouchDB<CustomGame>('test', { adapter: 'memory' });
  storageService = new StorageService(memoryDB);
});

// Given('the database throws on put', () => {
//   mockPut.mockRejectedValue(new Error('Failed to add game'));
// });

When('I add a game with:', async function (dataTable) {
  const game = dataTable.rowsHash();
  thrownError = null;
  try {
    testResult = await storageService.addGame(game);
  } catch (err: any) {
    thrownError = err;
  }
});

Then('the database should contain the game with id {string}', async (id: string) => {
  const doc = await memoryDB.get(id);
  assert.ok(doc);
  assert.strictEqual(doc._id, id);
});

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

Given('the database has no games', () => {
});

When('I fetch games', async () => {
  testResult = await storageService.fetchGames();
});

Then('I should receive:', (dataTable) => {
  const expected = dataTable.hashes();
  const actual = (testResult as Array<{ _id: string; name: string; exe: string; heroPath: string }>).map(({ _id, name, exe, heroPath }) => ({
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

// Given('removal of the game will fail', () => {
//   mockRemove.mockRejectedValue(new Error('failed_remove'));
// });

// Given('the database throws on get for id {string}', (id: string) => {
//   mockGet.mockRejectedValue(new Error('not_found'));
// });

When('I remove the game {string}', async (id: string) => {
  testResult = await storageService.removeGame(id);
});

Then('the game should be removed successfully', () => {
  const { ok, id } = testResult;
  assert.deepStrictEqual({ ok, id }, { ok: true, id: 'game1'});
});

Then('the operation should return failure for {string}', (expectedId: string) => {
  const { ok, id } = testResult;
  assert.deepStrictEqual({ ok, id }, { ok: false, expectedId });
});

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
  const expected = dataTable.hashes().map((row: any) => row._id);
  for (const id of expected) {
    try {
      await memoryDB.get(id);
      assert.fail(`Expected ${id} to be deleted`);
    } catch (err: any) {
      assert.strictEqual(err.status, 404);
    }
  }
});

Then('no bulk delete should occur', async () => {
  const result = await memoryDB.allDocs();
  assert.strictEqual(result.rows.length, 0);
});