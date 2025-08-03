/* eslint-disable @typescript-eslint/no-unused-vars */
import log from 'electron-log/renderer';
import { CustomGame } from './StorageType';

export default class StorageService {
    private customGameDb: PouchDB.Database<CustomGame>;

    constructor(customGameDb: PouchDB.Database<CustomGame>) {
        this.customGameDb = customGameDb;
    }

    addGame = async (game: Omit<CustomGame, '_id'> & { id: string }) => {
        const doc: CustomGame = {
            _id: game.id,
            name: game.name,
            exe: game.exe,
            heroPath: game.heroPath,
        };

        return this.customGameDb.put(doc);
    };

    removeGame = async (
        id: string,
    ): Promise<{ ok: boolean; id: string; rev: string }> => {
        try {
            const doc = await this.customGameDb.get(id);
            const result = await this.customGameDb.remove(doc);
            return {
                ok: result.ok,
                id: result.id,
                rev: result.rev,
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

    clearAllGames = async () => {
        const allDocs = await this.customGameDb.allDocs({ include_docs: true });
        const deletions = allDocs.rows.map((row: any) => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true,
        }));

        if (deletions.length > 0) {
            await this.customGameDb.bulkDocs(deletions as any);
        }
    };

    // Fetch all games
    fetchGames = async (): Promise<CustomGame[]> => {
        const result = await this.customGameDb.allDocs({ include_docs: true });
        const games = result.rows.map((row: any) => row.doc!).filter(Boolean);
        return games!;
    };
}
