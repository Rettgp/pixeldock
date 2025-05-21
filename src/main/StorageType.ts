import { app } from 'electron';
import path from 'path';
import PouchDB from 'pouchdb';

export type CustomGame = {
    _id: string;
    name: string;
    exe: string;
    heroPath: string;
};

export type Settings = {
    _id: string;
    _rev?: string;
    display: number;
};

export type Response = {
    ok: boolean;
    id: string;
    rev: string;
};

export const customGameDb = new PouchDB<CustomGame>(
    path.join(app.getPath('appData'), 'pixeldock-db', 'custom-games'),
);

export const settingsDb = new PouchDB<Settings>(
    path.join(app.getPath('appData'), 'pixeldock-db', 'settings'),
);
