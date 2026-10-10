import { BrowserWindow, Display, screen } from 'electron';

export const PREFERRED_WIDTH = 500;

// Docks the launcher strip to the right edge of the given display, shifted
// `offset` pixels along the horizontal axis (positive moves it left, away
// from the right edge; negative moves it right).
export function positionWindow(
    window: BrowserWindow,
    display: Display,
    offset: number = 0,
): void {
    const factor = display.scaleFactor;
    window.setPosition(
        Math.round(
            display.size.width -
                PREFERRED_WIDTH / factor +
                display.bounds.x -
                offset,
        ),
        display.bounds.y,
    );
}

export function findDisplay(displayId?: number): Display {
    const primary = screen.getPrimaryDisplay();
    if (!displayId) return primary;
    return screen.getAllDisplays().find((d) => d.id === displayId) ?? primary;
}

export interface DisplayOption {
    id: number;
    label: string;
    primary: boolean;
}

export function listDisplays(): DisplayOption[] {
    const primaryId = screen.getPrimaryDisplay().id;
    return screen
        .getAllDisplays()
        .sort((a, b) => a.bounds.x - b.bounds.x)
        .map((display, index) => ({
            id: display.id,
            label: display.label || `Monitor ${index + 1}`,
            primary: display.id === primaryId,
        }));
}
