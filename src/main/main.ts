/* eslint-disable max-classes-per-file */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { IpcChannelInterface } from '../ipc/IpcChannelInterface';
import ExampleChannel from '../ipc/ExampleChannel';
import GameLibraryChannel from '../ipc/GameLibraryChannel';

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
        app.on('ready', this.createWindow);
        app.on('window-all-closed', this.onWindowAllClosed);
        app.on('activate', this.onActivate);

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

        this.mainWindow = new BrowserWindow({
            show: false,
            width: 1024,
            height: 728,
            transparent: true,
            frame: false,
            icon: getAssetPath('icon.png'),
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                preload: app.isPackaged
                    ? path.join(__dirname, 'preload.js')
                    : path.join(__dirname, '../../.erb/dll/preload.js'),
            },
        });

        this.mainWindow.webContents.openDevTools();
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

        const menuBuilder = new MenuBuilder(this.mainWindow);
        menuBuilder.buildMenu();

        // Open urls in the user's browser
        this.mainWindow.webContents.setWindowOpenHandler((edata) => {
            shell.openExternal(edata.url);
            return { action: 'deny' };
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

new Main().init([new ExampleChannel(), new GameLibraryChannel()]);
