/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { settingsDb, Settings, Response } from './StorageType';

export const addGame = async (
    settings: Omit<Settings, '_id'> & { id: string },
) => {
    const doc: Settings = {
        _id: settings.id,
        display: settings.display,
    };

    return settingsDb.put(doc);
};

export const saveSettings = async (
    settings: Omit<Settings, '_id' | '_rev'> & { id: string },
): Promise<Response> => {
    try {
        const existingDoc = await settingsDb.get<Settings>(settings.id);

        const updatedDoc: Settings = {
            ...existingDoc,
            ...settings,
            _id: settings.id,
            _rev: existingDoc._rev,
        };

        return await settingsDb.put(updatedDoc);
    } catch (err: any) {
        if (err.status === 404) {
            const newDoc: Settings = {
                _id: settings.id,
                ...settings,
            };
            return settingsDb.put(newDoc);
        }
        throw err;
    }
};

export const fetchSettings = async (): Promise<Settings> => {
    const result = await settingsDb.allDocs({ include_docs: true });
    const settings = result.rows.map((row: any) => row.doc!).filter(Boolean);
    return settings?.[0] ?? { id: '0', display: 0 };
};
