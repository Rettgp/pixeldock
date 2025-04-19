import * as child from 'child_process';

export default function spawnGame(exePath: string) {
    const game = child.exec(`start ${exePath}`);
    game.unref();
}
