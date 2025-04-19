import './GameButton.css';
import IpcService from '../../ipc/IpcService';

function runGame(exePath: string) {
    const ipc = new IpcService();
    ipc.send<{ reply: any }>('game-library', {
        params: ['playGame', exePath],
    });
}

export default function GameButton({ runnable }) {
    return (
        <button
            type="button"
            className="gameButton"
            onClick={() => runGame(runnable.exe)}
            style={{
                backgroundImage: `url(steamimages://librarycache/${runnable.appid}/library_hero.jpg)`,
            }}
        >
            <div className="hoverBackground" />
            <h1 className="gameTitle">{runnable.name}</h1>
            {/* <img
                // TODO: This needs to scan for a library_hero or a library_header
                // eslint-disable-next-line no-octal-escape
                src={`steamimages://librarycache/${runnable.appid}/library_hero.jpg`}
                alt="hero"
            /> */}
        </button>
    );
}
