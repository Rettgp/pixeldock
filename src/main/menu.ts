import { screen, Menu, shell, BrowserWindow, Display } from 'electron';
import log from 'electron-log/main';
import SettingsService from './SettingsService';

export default class MenuBuilder {
    mainWindow: BrowserWindow;

    private settingsService: SettingsService;

    private preferredDisplayId: number;

    constructor(
        mainWindow: BrowserWindow,
        settingsService: SettingsService,
        preferredDisplayId: number,
    ) {
        this.mainWindow = mainWindow;
        this.settingsService = settingsService;
        this.preferredDisplayId = preferredDisplayId;
    }

    buildMenu(): Menu {
        this.setupMenu();

        const template = this.buildDefaultTemplate();

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        return menu;
    }

    positionWindow(display: Display): void {
        const factor = display.scaleFactor;
        const preferredWidth = 500;
        this.mainWindow!.setPosition(
            display.size.width - preferredWidth / factor + display.bounds.x,
            0,
        );
    }

    setupMenu(): void {
        this.mainWindow.webContents.on('context-menu', () => {
            Menu.buildFromTemplate(this.buildDefaultTemplate()).popup({
                window: this.mainWindow,
            });
        });
    }

    buildDefaultTemplate() {
        const sortedDisplays = screen
            .getAllDisplays()
            .sort((a, b) => a.bounds.x - b.bounds.x);
        const primaryDisplay = screen.getPrimaryDisplay();
        const templateDefault = [
            ...sortedDisplays.map((possibleDisplay, index) => {
                const isPrimary = possibleDisplay.id === primaryDisplay.id;
                const name = possibleDisplay.label || `Monitor ${index + 1}`;
                const label = isPrimary ? `${name} (Primary)` : name;
                return {
                    label,
                    type: 'radio' as const,
                    checked: possibleDisplay.id === this.preferredDisplayId,
                    click: async () => {
                        const win = this.mainWindow;
                        if (win) {
                            try {
                                const existing =
                                    await this.settingsService.fetchSettings();
                                await this.settingsService.saveSettings({
                                    // eslint-disable-next-line no-underscore-dangle
                                    id: existing._id ?? '0',
                                    display: possibleDisplay.id,
                                    steamLibraryCache:
                                        existing.steamLibraryCache ?? '',
                                    steamGamesLibrary:
                                        existing.steamGamesLibrary ?? '',
                                });
                                this.preferredDisplayId = possibleDisplay.id;
                                this.positionWindow(possibleDisplay);
                            } catch (error) {
                                log.error(
                                    'Failed to persist preferred display selection',
                                    error,
                                );
                                // Restore the checked radio item so the menu UI
                                // matches the unchanged preferred display.
                                Menu.setApplicationMenu(
                                    Menu.buildFromTemplate(
                                        this.buildDefaultTemplate(),
                                    ),
                                );
                            }
                        }
                    },
                };
            }),
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'Learn More',
                        click() {
                            shell.openExternal('https://electronjs.org');
                        },
                    },
                    {
                        label: 'Documentation',
                        click() {
                            shell.openExternal(
                                'https://github.com/electron/electron/tree/main/docs#readme',
                            );
                        },
                    },
                    {
                        label: 'Community Discussions',
                        click() {
                            shell.openExternal(
                                'https://www.electronjs.org/community',
                            );
                        },
                    },
                    {
                        label: 'Search Issues',
                        click() {
                            shell.openExternal(
                                'https://github.com/electron/electron/issues',
                            );
                        },
                    },
                ],
            },
        ];

        return templateDefault;
    }
}
