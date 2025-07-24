// const mockAllDocs = jest.fn();
// const mockPut = jest.fn();
// const mockGet = jest.fn();
// const mockRemove = jest.fn();

// // eslint-disable-next-line import/first
// import {
//     fetchGames,
//     addGame,
//     clearAllGames,
//     removeGame,
// } from '../main/CustomGameService';
// // eslint-disable-next-line import/first
// import { customGameDb, CustomGame } from '../main/StorageType';

// jest.mock('pouchdb', () => {
//     return {
//         PouchDB: {},
//     };
// });

// jest.mock('../main/StorageType', () => {
//     return {
//         customGameDb: {
//             allDocs: mockAllDocs,
//             bulkDocs: jest.fn(),
//             put: mockPut,
//             get: mockGet,
//             remove: mockRemove,
//         },
//     };
// });

// describe('addGame', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it('should add a game successfully', async () => {
//         const game = { id: 'game1', name: 'Game One', exe: '', heroPath: '' };
//         mockPut.mockResolvedValue({ id: 'game1', rev: '1-xyz' });

//         const result = await addGame(game);

//         expect(customGameDb.put).toHaveBeenCalledWith({
//             _id: 'game1',
//             name: 'Game One',
//             exe: '',
//             heroPath: '',
//         });
//         expect(result).toEqual({ id: 'game1', rev: '1-xyz' });
//     });

//     it('should throw an error if adding a game fails', async () => {
//         const game = { id: 'game2', name: 'Game Two', exe: '', heroPath: '' };
//         mockPut.mockRejectedValue(new Error('Failed to add game'));

//         await expect(addGame(game)).rejects.toThrow('Failed to add game');
//     });
// });

// describe('fetchGames', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it('should fetch all successfully', async () => {
//         const mockGames: CustomGame[] = [
//             { _id: 'game1', name: 'Game One', exe: 'path1', heroPath: 'hero1' },
//             { _id: 'game2', name: 'Game Two', exe: 'path2', heroPath: 'hero2' },
//         ];
//         mockAllDocs.mockResolvedValue({
//             rows: mockGames.map((game) => ({ doc: game })),
//         } as any);

//         const games = await fetchGames();

//         expect(games).toEqual(mockGames);
//     });

//     it('should fetch empty list if none exist', async () => {
//         const mockGames: CustomGame[] = [];
//         mockAllDocs.mockResolvedValue({
//             rows: mockGames.map((game) => ({ doc: game })),
//         } as any);

//         const games = await fetchGames();

//         expect(games).toEqual([]);
//     });
// });

// describe('removeGame', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it('should remove game by id', async () => {
//         const fakeDoc = {
//             _id: 'game1',
//             name: 'Game One',
//             exe: 'path1',
//             heroPath: 'hero1',
//         };
//         mockGet.mockResolvedValue(fakeDoc);
//         mockRemove.mockResolvedValue({ ok: true, id: 'game1', rev: '' });

//         const result = await removeGame('game1');

//         expect(mockGet).toHaveBeenCalledWith('game1');
//         expect(mockRemove).toHaveBeenCalledWith(fakeDoc);
//         expect(result).toEqual({ ok: true, id: 'game1', rev: '' });
//     });

//     it('failed get should return fail response', async () => {
//         mockGet.mockRejectedValue(new Error('not_found'));

//         const result = await removeGame('game2');

//         expect(mockGet).toHaveBeenCalledWith('game2');
//         expect(result).toEqual({ ok: false, id: 'game2', rev: '' });
//     });

//     it('failed remove should return fail response', async () => {
//         const fakeDoc = {
//             _id: 'game1',
//             name: 'Game One',
//             exe: 'path1',
//             heroPath: 'hero1',
//         };
//         mockGet.mockResolvedValue(fakeDoc);
//         mockRemove.mockRejectedValue(new Error('failed_remove'));

//         const result = await removeGame('game1');

//         expect(mockGet).toHaveBeenCalledWith('game1');
//         expect(mockRemove).toHaveBeenCalledWith(fakeDoc);
//         expect(result).toEqual({ ok: false, id: 'game1', rev: '' });
//     });
// });

// describe('clearAllCustomGames', () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     it('deletes all documents when there are documents', async () => {
//         (customGameDb.allDocs as jest.Mock).mockResolvedValue({
//             rows: [
//                 {
//                     id: 'doc1',
//                     value: { rev: '1-xxx' },
//                     doc: { _id: 'doc1', name: 'game1', exe: '', heroPath: '' },
//                 },
//                 {
//                     id: 'doc2',
//                     value: { rev: '1-yyy' },
//                     doc: { _id: 'doc2', name: 'game2', exe: '', heroPath: '' },
//                 },
//             ],
//         });

//         await clearAllGames();

//         expect(customGameDb.bulkDocs).toHaveBeenCalledWith([
//             { _id: 'doc1', _rev: '1-xxx', _deleted: true },
//             { _id: 'doc2', _rev: '1-yyy', _deleted: true },
//         ]);
//     });

//     it('does nothing when there are no documents', async () => {
//         (customGameDb.allDocs as jest.Mock).mockResolvedValue({ rows: [] });

//         await clearAllGames();

//         expect(customGameDb.bulkDocs).not.toHaveBeenCalled();
//     });
// });
