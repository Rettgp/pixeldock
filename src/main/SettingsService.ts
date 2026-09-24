/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-vars */
import PouchDB from 'pouchdb';
import { Settings, Response } from './StorageType';

export default class SettingsService {
    private settingsDb: PouchDB.Database<Settings>;

    constructor(settingsDb: PouchDB.Database<Settings>) {
        this.settingsDb = settingsDb;
    }

    saveSettings = async (
        input: Partial<Omit<Settings, '_id' | '_rev'>> & { id: string },
    ): Promise<Response> => {
        // Only merge fields that were provided so a partial save (e.g. just
        // the Steam paths) never clears the preferred display.
        const settings = Object.fromEntries(
            Object.entries(input).filter(([, value]) => value !== undefined),
        ) as typeof input;
        try {
            const existingDoc = await this.settingsDb.get<Settings>(
                settings.id,
            );

            const updatedDoc: Settings = {
                ...existingDoc,
                ...settings,
                _id: settings.id,
                _rev: existingDoc._rev,
            };

            return await this.settingsDb.put(updatedDoc);
        } catch (err: any) {
            if (err.status === 404) {
                const newDoc: Settings = {
                    display: 0,
                    steamLibraryCache: '',
                    steamGamesLibrary: '',
                    ...settings,
                    _id: settings.id,
                };
                return this.settingsDb.put(newDoc);
            }
            throw err;
        }
    };

    fetchSettings = async (): Promise<Settings> => {
        const result = await this.settingsDb.allDocs({ include_docs: true });
        const settings = result.rows
            .map((row: any) => row.doc!)
            .filter(Boolean);
        return (
            settings?.[0] ?? {
                _id: '0',
                display: 0,
                steamLibraryCache: '',
                steamGamesLibrary: '',
            }
        );
    };
}
