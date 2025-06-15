/* eslint-disable max-classes-per-file */
/* eslint global-require: off, no-console: off, promise/always-return: off */

import path from 'path';
import {
    app,
    screen,
    BrowserWindow,
    shell,
    ipcMain,
    protocol,
    net,
    Tray,
    Menu,
    Display,
} from 'electron';
import log from 'electron-log/main';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { IpcChannelInterface } from '../ipc/IpcChannelInterface';
import ExampleChannel from '../ipc/ExampleChannel';
import GameLibraryChannel from '../ipc/GameLibraryChannel';
import OpenFileChannel from '../ipc/OpenFileChannel';
import NavigateChannel from '../ipc/NavigateChannel';
import CustomGamesChannel from '../ipc/CustomGamesChannel';
import SettingsChannel from '../ipc/SettingsChannel';

log.initialize();

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

const isDebug =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
    require('electron-debug').default();
}

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];
    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload,
        )
        .catch(console.log);
};

class Main {
    private mainWindow: BrowserWindow | undefined;

    public init(ipcChannels: IpcChannelInterface[]) {
        app.on('ready', () => {
            this.createWindow();
            this.createTray();
        });
        app.on('window-all-closed', this.onWindowAllClosed);
        app.on('activate', this.onActivate);

        protocol.registerSchemesAsPrivileged([
            {
                scheme: 'steamimages',
                privileges: {
                    bypassCSP: true,
                    standard: true,
                    secure: true,
                    supportFetchAPI: true,
                },
            },
            {
                scheme: 'local',
                privileges: {
                    bypassCSP: true,
                    standard: true,
                    secure: true,
                    supportFetchAPI: true,
                },
            },
        ]);
        // eslint-disable-next-line promise/catch-or-return
        app.whenReady().then(() => {
            protocol.handle('steamimages', (request) => {
                const filePath = request.url.slice('steamimages://'.length);
                // TODO: Get this path from settings
                return net.fetch(
                    `C:\\Program Files (x86)\\Steam\\appcache\\${filePath}`,
                );
            });
            protocol.handle('local', (request) => {
                const filePath = request.url.slice('local://'.length);
                const url = filePath.replace(
                    /^[a-z]\//,
                    (match) => `${match[0].toUpperCase()}:/`,
                );
                return net.fetch(url);
            });
        });

        this.registerIpcChannels(ipcChannels);
    }

    private onWindowAllClosed() {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    }

    private onActivate() {
        if (!this.mainWindow) {
            this.createWindow();
        }
    }

    private navigate(page: string) {
        this.mainWindow?.webContents.send(NavigateChannel.name, {
            params: [page],
        });
    }

    private getAssetPath(...paths: string[]): string {
        const RESOURCES_PATH = app.isPackaged
            ? path.join(process.resourcesPath, 'assets')
            : path.join(__dirname, '../../assets');

        return path.join(RESOURCES_PATH, ...paths);
    }

    private createTray() {
        const tray = new Tray(this.getAssetPath('icon.png'));
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Settings',
                click: () => this.navigate('settings'),
            },
            {
                label: 'Games',
                click: () => this.navigate('game-settings'),
            },
            { label: 'Quit', click: () => app.quit() },
        ]);
        tray.setToolTip('Game Launch');
        tray.setContextMenu(contextMenu);
    }

    private createMonitorContextMenu(positioner: (display: Display) => void) {
        this.mainWindow!.webContents.on('context-menu', () => {
            const displays = screen.getAllDisplays();
            const menuItems = displays.map((display, index) => ({
                label: `Monitor ${index + 1}`,
                click: () => {
                    const win = this.mainWindow;
                    if (win) {
                        positioner(display);
                    }
                },
            }));

            const menu = Menu.buildFromTemplate(menuItems);
            menu.popup({ window: this.mainWindow! });
        });
    }

    private positionWindow(display: Display) {
        const factor = display.scaleFactor;
        const preferredWidth = 500;
        this.mainWindow!.setPosition(
            display.size.width - preferredWidth / factor + display.bounds.x,
            0,
        );
    }

    private async createWindow() {
        if (isDebug) {
            await installExtensions();
        }

        const RESOURCES_PATH = app.isPackaged
            ? path.join(process.resourcesPath, 'assets')
            : path.join(__dirname, '../../assets');

        const getAssetPath = (...paths: string[]): string => {
            return path.join(RESOURCES_PATH, ...paths);
        };

        const display = screen.getPrimaryDisplay();
        const factor = display.scaleFactor;
        const monitorHeight = display.size.height;
        const preferredWidth = 500;
        this.mainWindow = new BrowserWindow({
            show: false,
            x: 0,
            width: preferredWidth / factor,
            height: monitorHeight / factor,
            transparent: true,
            frame: false,
            icon: getAssetPath('icon.png'),
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                zoomFactor: 1.0 / factor,
                preload: app.isPackaged
                    ? path.join(__dirname, 'preload.js')
                    : path.join(__dirname, '../../.erb/dll/preload.js'),
            },
            alwaysOnTop: false,
        });
        this.positionWindow(display);

        this.mainWindow.loadFile('../../index.html');

        this.mainWindow.loadURL(resolveHtmlPath('index.html'));

        this.mainWindow.on('ready-to-show', () => {
            if (!this.mainWindow) {
                throw new Error('"mainWindow" is not defined');
            }
            if (process.env.START_MINIMIZED) {
                this.mainWindow.minimize();
            } else {
                this.mainWindow.show();
            }
        });

        this.mainWindow.setSkipTaskbar(true);

        const menuBuilder = new MenuBuilder(this.mainWindow);
        menuBuilder.buildMenu();

        // Open urls in the user's browser
        this.mainWindow.webContents.setWindowOpenHandler((edata) => {
            shell.openExternal(edata.url);
            return { action: 'deny' };
        });

        this.createMonitorContextMenu();
        this.mainWindow!.webContents.on('context-menu', () => {
            const displays = screen.getAllDisplays();
            const menuItems = displays.map((possibleDisplay, index) => ({
                label: `Monitor ${index + 1}`,
                click: () => {
                    const win = this.mainWindow;
                    if (win) {
                        this.positionWindow(possibleDisplay);
                    }
                },
            }));

            const menu = Menu.buildFromTemplate(menuItems);
            menu.popup({ window: this.mainWindow! });
        });
    }

    private registerIpcChannels(ipcChannels: IpcChannelInterface[]) {
        ipcChannels.forEach((channel) =>
            ipcMain.on(channel.getName(), (event, request) =>
                channel.handle(event, request),
            ),
        );
    }
}

new Main().init([
    new ExampleChannel(),
    new GameLibraryChannel(),
    new OpenFileChannel(),
    new NavigateChannel(),
    new CustomGamesChannel(),
    new SettingsChannel(),
]);
