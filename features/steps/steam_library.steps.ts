/* eslint-disable func-names */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import mockFs from 'mock-fs';
import SteamLibrary from '../../src/main/library-parser/SteamLibrary';

let result: any[];

Given(
    'there are multiple appmanifest files with different StateFlags',
    function () {
        mockFs({
            './steamapps/appmanifest_1234.acf': `
      "AppState"
      {
          "appid"		"1234"
          "name"		"Terraria"
          "StateFlags"		"0"
      }`,
            './steamapps/appmanifest_5678.acf': `
      "AppState"
      {
          "appid"		"5678"
          "name"		"Satisfactory"
          "StateFlags"		"4"
      }`,
            './steamapps/appmanifest_9012.acf': `
      "AppState"
      {
          "appid"		"9012"
          "name"		"Path of Exile"
          "StateFlags"		"4"
      }`,
        });
    },
);

When('the Steam library is parsed', function () {
    const library = new SteamLibrary();
    result = library.getGames('./steamapps');
});

Then('only games with StateFlag {string} are included', function () {
    result.forEach((game) => {
        assert.strictEqual(game.exe, `steam://rungameid/${game.appid}`);
    });
});

Then('the result should contain {int} games', function (count: number) {
    assert.strictEqual(result.length, count);
});

Then('the games should include:', function (dataTable) {
    const expectedGames = dataTable.hashes();
    expectedGames.forEach((expected: { appid: any; name: any }) => {
        const match = result.find(
            (g) => g.appid === expected.appid && g.name === expected.name,
        );
        assert.ok(match, `Missing expected game: ${expected.name}`);
    });
});
