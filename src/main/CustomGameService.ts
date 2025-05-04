/* eslint-disable @typescript-eslint/no-unused-vars */
import log from 'electron-log/renderer';
import { customGameDb, CustomGame, Response } from './StorageType';

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

export const removeGame = async (id: string): Promise<Response> => {
    try {
        const doc = await customGameDb.get(id);
        const result = customGameDb.remove(doc);
        return {
            ok: (await result).ok,
            id: (await result).id,
            rev: (await result).rev,
        };
    } catch (error) {
        log.error(`Failed to remove ${id}: `, error);
        return {
            ok: false,
            id,
            rev: '',
        };
    }
};

export const clearAllGames = async () => {
    const allDocs = await customGameDb.allDocs({ include_docs: true });
    const deletions = allDocs.rows.map((row: any) => ({
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
    const games = result.rows.map((row: any) => row.doc!).filter(Boolean);
    return games!;
};
