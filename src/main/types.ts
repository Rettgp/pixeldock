export interface SteamGame {
    appid: string;
    name: string;
    installed: boolean;
}

export interface Runnable {
    name: string;
    appid: string;
    heroPath: string;
    logoPath: string;
    iconPath: string;
    exe: string;
    nonSteam?: boolean;
}

export interface LibraryConnector {
    getGames(path: string): Runnable[];
}
