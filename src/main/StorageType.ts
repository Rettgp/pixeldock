import PouchDB from 'pouchdb';

export type CustomGame = {
    _id: string;
    name: string;
    exe: string;
    heroPath: string;
};

export type Response = {
    ok: boolean;
    id: string;
    rev: string;
};

export const customGameDb = new PouchDB<CustomGame>('custom-games');
