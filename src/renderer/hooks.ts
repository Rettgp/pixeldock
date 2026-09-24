import { useCallback, useEffect, useRef, useState } from 'react';
import log from 'electron-log/renderer';
import {
    api,
    LIBRARY_UPDATED,
    Runnable,
    SetupValidation,
    SteamPaths,
} from './api';

// Game list that refreshes itself whenever the main process reports a change
export function useLibrary(enabled: boolean) {
    const [games, setGames] = useState<Runnable[]>([]);

    const load = useCallback(() => {
        api.getGames()
            .then((runnables) => setGames(runnables ?? []))
            .catch((error) => log.error(error));
    }, []);

    useEffect(() => {
        if (!enabled) return undefined;
        load();
        return api.listen(LIBRARY_UPDATED, load);
    }, [enabled, load]);

    return games;
}

// Validates both Steam paths, debounced while the user types
export function usePathValidation(paths: SteamPaths, delay = 250) {
    const [validation, setValidation] = useState<SetupValidation | null>(null);
    const [pending, setPending] = useState(true);
    const requestId = useRef(0);

    useEffect(() => {
        setPending(true);
        const id = requestId.current + 1;
        requestId.current = id;
        const timer = setTimeout(() => {
            api.validate(paths)
                .then((result) => {
                    if (requestId.current === id) {
                        setValidation(result);
                        setPending(false);
                    }
                    return result;
                })
                .catch((error) => log.error(error));
        }, delay);
        return () => clearTimeout(timer);
    }, [paths, delay]);

    return { validation, pending };
}
