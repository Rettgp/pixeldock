import PouchDB from 'pouchdb';

export type CustomGame = {
    _id: string;
    name: string;
    exe: string;
    heroPath: string;
};

export const customGameDb = new PouchDB<CustomGame>('custom-games');
