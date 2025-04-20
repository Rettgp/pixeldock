import './GameButton.css';
import IpcService from '../../ipc/IpcService';
import { Runnable } from '../../main/types';

function runGame(exePath: string) {
    const ipc = new IpcService();
    ipc.send<{ reply: any }>('game-library', {
        params: ['playGame', exePath],
    });
}

interface Props {
    runnable: Runnable;
}

export default function GameButton({ runnable }: Props) {
    return (
        <button
            type="button"
            className="gameButton"
            onClick={() => runGame(runnable.exe)}
            style={{
                // TODO: This needs to scan for a library_hero or a library_header
                backgroundImage: `url(steamimages://librarycache/${runnable.appid}/library_hero.jpg)`,
            }}
        >
            <div className="hoverBackground" />
            <h1 className="gameTitle">{runnable.name}</h1>
        </button>
    );
}
