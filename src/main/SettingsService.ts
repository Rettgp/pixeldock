/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-vars */
import log from 'electron-log/renderer';
import { Settings, Response } from './StorageType';

export class SettingsService {
    private settingsDb: PouchDB.Database<Settings>;

    constructor(
        settingsDb: PouchDB.Database<Settings>
    ) {
        this.settingsDb = settingsDb;
    }

    addGame = async (
        settings: Omit<Settings, '_id'> & { id: string },
    ) => {
        const doc: Settings = {
            _id: settings.id,
            display: settings.display,
        };

        return this.settingsDb.put(doc);
    };

    saveSettings = async (
        settings: Omit<Settings, '_id' | '_rev'> & { id: string },
    ): Promise<Response> => {
        try {
            const existingDoc = await this.settingsDb.get<Settings>(settings.id);

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
                    _id: settings.id,
                    ...settings,
                };
                return this.settingsDb.put(newDoc);
            }
            throw err;
        }
    };

    fetchSettings = async (): Promise<Settings> => {
        const result = await this.settingsDb.allDocs({ include_docs: true });
        const settings = result.rows.map((row: any) => row.doc!).filter(Boolean);
        return settings?.[0] ?? { id: '0', display: 0 };
    };
}
