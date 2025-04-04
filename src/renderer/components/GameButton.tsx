import './GameButton.css';
import IpcService from '../../ipc/IpcService';

export default function GameButton({ appid }) {
    return (
        <div className="gameButton">
            <img
                // TODO: This needs to scan for a library_hero or a library_header
                // eslint-disable-next-line no-octal-escape
                src={`steamimages://librarycache/${appid}/library_hero.jpg`}
                alt="hero"
            />
        </div>
    );
}
