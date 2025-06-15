import { screen, Menu, shell, BrowserWindow, Display } from 'electron';

export default class MenuBuilder {
    mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
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
        const displays = screen.getAllDisplays();
        const templateDefault = [
            ...displays.map((possibleDisplay, index) => ({
                label: `Monitor ${index + 1}`,
                click: () => {
                    const win = this.mainWindow;
                    if (win) {
                        this.positionWindow(possibleDisplay);
                    }
                },
            })),
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
