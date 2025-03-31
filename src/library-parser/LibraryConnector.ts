export interface Runnable {
    name: string;
    heroPath: string;
    exe: string;
}

export interface LibraryConnector {
    getGames(path: string): Runnable[];
}
