// import mockFs from 'mock-fs';
// import {
//     parseManifest,
//     InvalidAppId,
//     InvalidName,
//     InvalidState,
// } from '../main/library-parser/SteamManifestParser';
// import { SteamGame } from '../main/types';

// describe('Valid manifest', () => {
//     beforeEach(() => {
//         mockFs({
//             'valid_manifest.acf': `
//                 "AppState"
//                 {
//                     "appid"		"526870"
//                     "universe"		"1"
//                     "LauncherPath"		"C:\\Program Files (x86)\\Steam\\steam.exe"
//                     "name"		"Valid Game"
//                     "StateFlags"		"4"
//                     "installdir"		"ValidGame"
//                     "LastUpdated"		"1735675118"
//                     "LastPlayed"		"1743366046"
//                     "SizeOnDisk"		"27241375972"
//                     "StagingSize"		"0"
//                     "buildid"		"16775602"
//                     "LastOwner"		"76561198035337450"
//                     "AutoUpdateBehavior"		"0"
//                     "AllowOtherDownloadsWhileRunning"		"0"
//                     "ScheduledAutoUpdate"		"0"
//                     "InstalledDepots"
//                     {
//                         "526871"
//                         {
//                             "manifest"		"3007809920758804289"
//                             "size"		"27241375972"
//                         }
//                     }
//                     "SharedDepots"
//                     {
//                         "228988"		"228980"
//                     }
//                     "UserConfig"
//                     {
//                         "language"		"english"
//                     }
//                     "MountedConfig"
//                     {
//                         "language"		"english"
//                     }
//                 }`,
//         });
//     });

//     afterEach(() => {
//         mockFs.restore();
//     });

//     it('should populate game app id', () => {
//         const game: SteamGame = parseManifest('valid_manifest.acf');
//         expect(game.appid).toEqual('526870');
//     });

//     it('should populate game name', () => {
//         const game: SteamGame = parseManifest('valid_manifest.acf');
//         expect(game.name).toEqual('Valid Game');
//     });

//     it('should populate game installation state', () => {
//         const game: SteamGame = parseManifest('valid_manifest.acf');
//         expect(game.installed).toBeTruthy();
//     });
// });

// describe('Invalid Manifest', () => {
//     beforeEach(() => {
//         mockFs({
//             'invalid_appid.acf': `
//                 "AppState"
//                 {
//                     "name"		"Valid Game"
//                     "StateFlags"		"4"
//                 }`,
//             'invalid_name.acf': `
//                 "AppState"
//                 {
//                     "appid"		"526870"
//                     "StateFlags"		"4"
//                 }`,
//             'invalid_state.acf': `
//                 "AppState"
//                 {
//                     "appid"		"526870"
//                     "name"		"Valid Game"
//                 }`,
//         });
//     });
//     afterEach(() => {
//         mockFs.restore();
//     });

//     it('no appid throws exception', () => {
//         expect(() => {
//             parseManifest('invalid_appid.acf');
//         }).toThrow(InvalidAppId);
//     });
//     it('no name throws exception', () => {
//         expect(() => {
//             parseManifest('invalid_name.acf');
//         }).toThrow(InvalidName);
//     });
//     it('no gamestate throws exception', () => {
//         expect(() => {
//             parseManifest('invalid_state.acf');
//         }).toThrow(InvalidState);
//     });
// });

// describe('Manifest does not exist', () => {
//     it('file not found creates empty game', () => {
//         const game = parseManifest('no_manifest.acf');
//         expect(game.appid).toEqual('0');
//         expect(game.name).toEqual('UNKNOWN');
//         expect(game.installed).toBeFalsy();
//     });
// });
