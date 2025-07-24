// import mockFs from 'mock-fs';
// import SteamLibrary from '../main/library-parser/SteamLibrary';

// describe('steam library parses all games from manifests', () => {
//     beforeEach(() => {
//         mockFs({
//             './steamapps/appmanifest_1234.acf': `
//                 "AppState"
//                 {
//                     "appid"		"1234"
//                     "name"		"Terraria"
//                     "StateFlags"		"0"
//                 }`,
//             './steamapps/appmanifest_5678.acf': `
//                 "AppState"
//                 {
//                     "appid"		"5678"
//                     "name"		"Satisfactory"
//                     "StateFlags"		"4"
//                 }`,
//             './steamapps/appmanifest_9012.acf': `
//                 "AppState"
//                 {
//                     "appid"		"9012"
//                     "name"		"Path of Exile"
//                     "StateFlags"		"4"
//                 }`,
//         });
//     });
//     afterEach(() => {
//         mockFs.restore();
//     });

//     it('contains only installed games', () => {
//         const library = new SteamLibrary();
//         const games = library.getGames('./steamapps');
//         expect(games.length).toEqual(2);
//         expect(games[0]).toEqual({
//             appid: '5678',
//             exe: 'steam://rungameid/5678',
//             heroPath: '',
//             name: 'Satisfactory',
//         });
//         expect(games[1]).toEqual({
//             appid: '9012',
//             exe: 'steam://rungameid/9012',
//             heroPath: '',
//             name: 'Path of Exile',
//         });
//     });
// });
