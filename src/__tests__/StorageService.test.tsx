import {
    fetchGames,
    addGame,
    clearAllGames,
} from '../renderer/CustomGameService';
import { customGameDb, CustomGame } from '../renderer/StorageType';

jest.mock('../renderer/StorageType', () => {
    const mockPut = jest.fn();
    const mockGet = jest.fn();
    return {
        customGameDb: {
            allDocs: jest.fn(),
            bulkDocs: jest.fn(),
            put: mockPut,
            get: mockGet,
        },
    };
});

type MockDb = {
    put: jest.Mock<Promise<any>, [any]>;
    get: jest.Mock<Promise<any>, [string]>;
    allDocs: jest.Mock<Promise<any>, [CustomGame]>;
};

describe('addGame', () => {
    let mockedDb: MockDb;

    beforeEach(() => {
        mockedDb = customGameDb as unknown as MockDb;
        mockedDb.put.mockReset();
    });

    it('should add a game successfully', async () => {
        const game = { id: 'game1', name: 'Game One', exe: '', heroPath: '' };
        mockedDb.put.mockResolvedValue({ id: 'game1', rev: '1-xyz' });

        const result = await addGame(game);

        expect(customGameDb.put).toHaveBeenCalledWith({
            _id: 'game1',
            name: 'Game One',
            exe: '',
            heroPath: '',
        });
        expect(result).toEqual({ id: 'game1', rev: '1-xyz' });
    });

    it('should throw an error if adding a game fails', async () => {
        const game = { id: 'game2', name: 'Game Two', exe: '', heroPath: '' };
        mockedDb.put.mockRejectedValue(new Error('Failed to add game'));

        await expect(addGame(game)).rejects.toThrow('Failed to add game');
    });
});

describe('fetchGames', () => {
    let mockedDb: MockDb;

    beforeEach(() => {
        mockedDb = customGameDb as unknown as MockDb;
        mockedDb.get.mockReset();
    });

    it('should fetch all successfully', async () => {
        const mockGames: CustomGame[] = [
            { _id: 'game1', name: 'Game One', exe: 'path1', heroPath: 'hero1' },
            { _id: 'game2', name: 'Game Two', exe: 'path2', heroPath: 'hero2' },
        ];
        mockedDb.allDocs.mockResolvedValue({
            rows: mockGames.map((game) => ({ doc: game })),
        } as any);

        const games = await fetchGames();

        expect(games).toEqual(mockGames);
        expect(mockedDb.allDocs).toHaveBeenCalledWith({ include_docs: true });
    });

    it('should fetch empty list if none exist', async () => {
        const mockGames: CustomGame[] = [];
        mockedDb.allDocs.mockResolvedValue({
            rows: mockGames.map((game) => ({ doc: game })),
        } as any);

        const games = await fetchGames();

        expect(games).toEqual([]);
        expect(mockedDb.allDocs).toHaveBeenCalledWith({ include_docs: true });
    });
});

describe('clearAllCustomGames', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deletes all documents when there are documents', async () => {
        (customGameDb.allDocs as jest.Mock).mockResolvedValue({
            rows: [
                {
                    id: 'doc1',
                    value: { rev: '1-xxx' },
                    doc: { _id: 'doc1', name: 'game1', exe: '', heroPath: '' },
                },
                {
                    id: 'doc2',
                    value: { rev: '1-yyy' },
                    doc: { _id: 'doc2', name: 'game2', exe: '', heroPath: '' },
                },
            ],
        });

        await clearAllGames();

        expect(customGameDb.bulkDocs).toHaveBeenCalledWith([
            { _id: 'doc1', _rev: '1-xxx', _deleted: true },
            { _id: 'doc2', _rev: '1-yyy', _deleted: true },
        ]);
    });

    it('does nothing when there are no documents', async () => {
        (customGameDb.allDocs as jest.Mock).mockResolvedValue({ rows: [] });

        await clearAllGames();

        expect(customGameDb.bulkDocs).not.toHaveBeenCalled();
    });
});
