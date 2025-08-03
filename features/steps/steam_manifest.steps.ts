/* eslint-disable no-restricted-syntax */
/* eslint-disable func-names */
import { Given, When, Then } from '@cucumber/cucumber';
import mockFs from 'mock-fs';
import assert from 'assert';
import { parseManifest } from '../../src/main/library-parser/SteamManifestParser';

let parsedGame: any;
let thrownError: Error | null = null;

Given(
    'a manifest file {string} with valid content',
    function (filename: string) {
        mockFs({
            [filename]: `
      "AppState"
      {
        "appid"    "526870"
        "name"     "Valid Game"
        "StateFlags"   "4"
      }`,
        });
    },
);

Given(
    'a manifest file {string} missing the {word}',
    function (filename: string, missingField: string) {
        const fieldSnippets: Record<string, string> = {
            appid: `"name" "Valid Game"\n"StateFlags" "4"`,
            name: `"appid" "526870"\n"StateFlags" "4"`,
            state: `"appid" "526870"\n"name" "Valid Game"`,
        };

        mockFs({
            [filename]: `
      "AppState"
      {
        ${fieldSnippets[missingField]}
      }`,
        });
    },
);

When('I parse the manifest file {string}', function (filename: string) {
    thrownError = null;
    try {
        parsedGame = parseManifest(filename);
    } catch (err: any) {
        thrownError = err;
    }
});

Then('the game fields should be:', function (dataTable) {
    const expectedFields = dataTable.hashes();

    for (const { field, value } of expectedFields) {
        const actualValue = parsedGame[field];
        let expectedTypedValue: any = value;

        if (value === 'true') expectedTypedValue = true;
        else if (value === 'false') expectedTypedValue = false;

        assert.strictEqual(
            actualValue,
            expectedTypedValue,
            `Expected field "${field}" to be "${expectedTypedValue}", but got "${actualValue}"`,
        );
    }
});

Then('it should throw {string}', function (expectedError: string) {
    assert.ok(thrownError, 'Expected an error to be thrown');
    assert.strictEqual(thrownError.constructor.name, expectedError);
});
