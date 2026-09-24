import * as fs from 'fs';
import log from 'electron-log/main';
import LibraryService, { LibraryPaths } from './LibraryService';
import {
    getLibraryAppDirs,
    getSteamUsers,
    steamRootFromCache,
} from './library-parser/SteamPaths';
import { Runnable } from './types';

const DEBOUNCE_MS = 750;
const POLL_MS = 60_000;

interface WatchTarget {
    dir: string;
    recursive?: boolean;
    filter?: (file: string) => boolean;
}

// Watches every Steam location that feeds the library and reports when the
// resulting game list actually changes. fs.watch gives near-instant updates;
// the slow poll catches anything it misses (network drives, folders created
// after startup such as a first `grid` folder).
export default class LibraryWatcher {
    private watchers: fs.FSWatcher[] = [];

    private debounceTimer: ReturnType<typeof setTimeout> | undefined;

    private pollTimer: ReturnType<typeof setInterval> | undefined;

    private signature = '';

    private watchedKey = '';

    private libraryService: LibraryService;

    private getPaths: () => Promise<LibraryPaths>;

    private onChange: (runnables: Runnable[]) => void;

    constructor(
        libraryService: LibraryService,
        getPaths: () => Promise<LibraryPaths>,
        onChange: (runnables: Runnable[]) => void,
    ) {
        this.libraryService = libraryService;
        this.getPaths = getPaths;
        this.onChange = onChange;
    }

    async start(): Promise<void> {
        this.stop();
        const paths = await this.getPaths();
        this.watchAll(paths);
        this.signature = this.computeSignature(
            this.libraryService.getRunnables(paths),
        );
        this.pollTimer = setInterval(() => this.check(), POLL_MS);
    }

    stop(): void {
        this.watchers.forEach((watcher) => watcher.close());
        this.watchers = [];
        this.watchedKey = '';
        clearTimeout(this.debounceTimer);
        clearInterval(this.pollTimer);
    }

    // Re-read the library now and notify if anything changed.
    async check(force = false): Promise<void> {
        try {
            const paths = await this.getPaths();
            // Pick up newly created folders (a new library, a first grid dir)
            this.watchAll(paths);
            const runnables = this.libraryService.getRunnables(paths);
            const signature = this.computeSignature(runnables);
            if (force || signature !== this.signature) {
                this.signature = signature;
                this.onChange(runnables);
            }
        } catch (error) {
            log.error('LibraryWatcher : Failed to refresh library', error);
        }
    }

    private schedule(): void {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.check(), DEBOUNCE_MS);
    }

    private computeSignature(runnables: Runnable[]): string {
        return JSON.stringify(runnables);
    }

    private targets(paths: LibraryPaths): WatchTarget[] {
        const cache = paths.steamLibraryCache || '';
        const steamRoot = steamRootFromCache(cache);
        const targets: WatchTarget[] = getLibraryAppDirs(
            paths.steamGamesLibrary || '',
            cache,
        ).map((dir) => ({
            dir,
            filter: (file) => /^appmanifest_\d+\.acf$/i.test(file),
        }));

        if (cache) targets.push({ dir: cache, recursive: true });

        if (steamRoot) {
            targets.push({
                dir: `${steamRoot}/steamapps`,
                filter: (file) => file.toLowerCase() === 'libraryfolders.vdf',
            });
            getSteamUsers(steamRoot).forEach((user) => {
                targets.push({
                    dir: user.configDir,
                    filter: (file) => file.toLowerCase() === 'shortcuts.vdf',
                });
                targets.push({ dir: user.gridDir });
            });
        }
        return targets.filter((target) => fs.existsSync(target.dir));
    }

    private watchAll(paths: LibraryPaths): void {
        const targets = this.targets(paths);
        const key = JSON.stringify(targets.map((t) => t.dir));
        if (key === this.watchedKey) return;

        this.watchers.forEach((watcher) => watcher.close());
        this.watchers = [];
        this.watchedKey = key;

        targets.forEach(({ dir, recursive, filter }) => {
            try {
                const watcher = fs.watch(
                    dir,
                    { recursive: !!recursive, persistent: false },
                    (_event, filename) => {
                        const file = filename ? filename.toString() : '';
                        if (!filter || !file || filter(file)) this.schedule();
                    },
                );
                watcher.on('error', (error) => {
                    log.warn(`LibraryWatcher : Watch error on ${dir}`, error);
                });
                this.watchers.push(watcher);
            } catch (error) {
                log.warn(`LibraryWatcher : Unable to watch ${dir}`, error);
            }
        });
    }
}
