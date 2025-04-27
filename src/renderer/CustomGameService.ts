/* eslint-disable @typescript-eslint/no-unused-vars */
import { customGameDb, CustomGame } from './StorageType';

export const addGame = async (
    game: Omit<CustomGame, '_id'> & { id: string },
) => {
    const doc: CustomGame = {
        _id: game.id,
        name: game.name,
        exe: game.exe,
        heroPath: game.heroPath,
    };

    return customGameDb.put(doc);
};

export const clearAllGames = async () => {
    const allDocs = await customGameDb.allDocs({ include_docs: true });
    const deletions = allDocs.rows.map((row) => ({
        _id: row.id,
        _rev: row.value.rev,
        _deleted: true,
    }));

    if (deletions.length > 0) {
        await customGameDb.bulkDocs(deletions as any);
    }
};

// Fetch all games
export const fetchGames = async (): Promise<CustomGame[]> => {
    const result = await customGameDb.allDocs({ include_docs: true });
    const games = result.rows.map((row) => row.doc!).filter(Boolean);
    return games!;
};
