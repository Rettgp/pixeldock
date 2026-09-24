import { app } from 'electron';
import path from 'path';
import PouchDB from 'pouchdb';

export type Settings = {
    _id: string;
    _rev?: string;
    display: number;
    steamLibraryCache: string;
    steamGamesLibrary: string;
};

export type Response = {
    ok: boolean;
    id: string;
    rev: string;
};

export const createSettingsDb = (
    customPath: string = path.join(
        app.getPath('appData'),
        'pixeldock-db',
        'settings',
    ),
) => {
    return new PouchDB<Settings>(path.join(customPath));
};
