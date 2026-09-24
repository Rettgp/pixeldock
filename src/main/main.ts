/* eslint-disable max-classes-per-file */
/* eslint global-require: off, no-console: off, promise/always-return: off */

import path from 'path';
import { pathToFileURL } from 'url';
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
} from 'electron';
import log from 'electron-log/main';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { IpcChannelInterface } from '../ipc/IpcChannelInterface';
import ExampleChannel from '../ipc/ExampleChannel';
import GameLibraryChannel from '../ipc/GameLibraryChannel';
import OpenFileChannel from '../ipc/OpenFileChannel';
import NavigateChannel from '../ipc/NavigateChannel';
import SettingsChannel from '../ipc/SettingsChannel';
import SettingsService from './SettingsService';
import { createSettingsDb } from './StorageType';
import LibraryService from './LibraryService';
import LibraryWatcher from './LibraryWatcher';
import { steamRootFromCache } from './library-parser/SteamPaths';
import { findDisplay, positionWindow, PREFERRED_WIDTH } from './window';

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

const settingsService: SettingsService = new SettingsService(
    createSettingsDb(),
);
const libraryService = new LibraryService();

const LIBRARY_UPDATED_CHANNEL = 'library-updated';

// Serves `root/<relative>` for a custom protocol, ignoring the cache-busting
// query string and refusing anything that escapes the root directory.
function serveFromRoot(root: string, relative: string) {
    const decoded = decodeURIComponent(relative.split('?')[0]);
    const resolvedRoot = path.resolve(root);
    const filePath = path.resolve(resolvedRoot, decoded);
    if (
        !root ||
        !filePath
            .toLowerCase()
            .startsWith(`${resolvedRoot.toLowerCase()}${path.sep}`)
    ) {
        return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
}

class Main {
    private mainWindow: BrowserWindow | undefined;

    private tray: Tray | undefined;

    readonly libraryWatcher = new LibraryWatcher(
        libraryService,
        () => settingsService.fetchSettings(),
        () => this.notifyLibraryUpdated(),
    );

    public init(ipcChannels: IpcChannelInterface[]) {
        app.on('ready', () => {
            this.createWindow();
            this.createTray();
            this.libraryWatcher
                .start()
                .catch((error) => log.error('Failed to start watcher', error));
        });
        app.on('before-quit', () => this.libraryWatcher.stop());
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
                scheme: 'steamgrid',
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
            protocol.handle('steamimages', async (request) => {
                const settings = await settingsService.fetchSettings();
                return serveFromRoot(
                    settings.steamLibraryCache,
                    request.url.slice('steamimages://image/'.length),
                );
            });
            // steamgrid://image/<accountId>/<file> -> userdata/<id>/config/grid
            protocol.handle('steamgrid', async (request) => {
                const settings = await settingsService.fetchSettings();
                const [accountId, ...rest] = request.url
                    .slice('steamgrid://image/'.length)
                    .split('/');
                if (!/^\d+$/.test(accountId)) {
                    return new Response('Not found', { status: 404 });
                }
                const gridDir = path.join(
                    steamRootFromCache(settings.steamLibraryCache),
                    'userdata',
                    accountId,
                    'config',
                    'grid',
                );
                return serveFromRoot(gridDir, rest.join('/'));
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

    notifyLibraryUpdated() {
        this.mainWindow?.webContents.send(LIBRARY_UPDATED_CHANNEL, {
            params: [],
        });
    }

    async onSettingsSaved(displayId: number) {
        if (this.mainWindow && displayId) {
            positionWindow(this.mainWindow, findDisplay(displayId));
        }
        await this.libraryWatcher.start();
        this.notifyLibraryUpdated();
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
        this.tray = new Tray(this.getAssetPath('icon.png'));
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Settings',
                click: () => this.navigate('settings'),
            },
            {
                label: 'Refresh library',
                click: () => this.libraryWatcher.check(true),
            },
            { type: 'separator' },
            { label: 'Quit', click: () => app.quit() },
        ]);
        this.tray.setToolTip('PixelDock');
        this.tray.setContextMenu(contextMenu);
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

        let display = screen.getPrimaryDisplay();
        let preferredDisplayId = display.id;

        try {
            const settings = await settingsService.fetchSettings();
            display = findDisplay(settings.display);
            preferredDisplayId = display.id;
        } catch (error) {
            log.error(
                'Failed to fetch settings for display selection; falling back to primary display.',
                error,
            );
        }

        const factor = display.scaleFactor;
        const monitorHeight = display.size.height;
        this.mainWindow = new BrowserWindow({
            show: false,
            x: 0,
            width: PREFERRED_WIDTH / factor,
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
        positionWindow(this.mainWindow, display);

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

        const menuBuilder = new MenuBuilder(
            this.mainWindow,
            settingsService,
            preferredDisplayId,
        );
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

const main = new Main();
main.init([
    new ExampleChannel(),
    new GameLibraryChannel(settingsService, libraryService, () =>
        main.libraryWatcher.check(true),
    ),
    new OpenFileChannel(),
    new NavigateChannel(),
    new SettingsChannel(settingsService, (settings) => {
        main.onSettingsSaved(settings.display).catch((error) =>
            log.error('Failed to apply settings', error),
        );
    }),
]);
