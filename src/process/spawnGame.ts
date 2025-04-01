import * as child from 'child_process';

export default function spawnGame(exePath: string) {
    console.log(exePath);
    const game = child.exec(`start ${exePath}`);
    game.unref();
}
