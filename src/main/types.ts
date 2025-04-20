export interface SteamGame {
    appid: string;
    name: string;
    installed: boolean;
}

export interface Runnable {
    name: string;
    appid: string;
    heroPath: string;
    exe: string;
}

export interface LibraryConnector {
    getGames(path: string): Runnable[];
}
