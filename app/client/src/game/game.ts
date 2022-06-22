import { io, Socket } from "socket.io-client";
import { Player, PlayerInfo } from './player';
import { getUserLang } from "./locales";
import { Match } from "./match";
import { Sandbox } from "./sandbox";
import { SpectateMatch } from "./spectate";

export enum GameState {
    Loading,
    LoggedOut,
    Connecting,
    SearchingGame,
    Started,
    Over,
    Sandbox,
    Tutorial,
    Management
}

export interface GameServerPlayerDescription {
    nickname: string,
    lang: string,
}

export interface GameServerMatchDescription {
    id: string,
    player1: string,
    player2: string
}

export interface GameServerStats {
    bots: number,
    players: {
        count: number,
        list: GameServerPlayerDescription[]
    },
    admins: {
        count: number,
        list: string[]
    },
    matches: {
        count: number,
        list: GameServerMatchDescription[]
    }
}

type StateUpdatedCallback = (state: GameState) => void;
type StatsUpdatedCallback = (result: GameServerStats) => void;

export class Game {

    public readonly socket: Socket;

    private state: GameState = GameState.Loading;

    protected player: Player;
    private match: Match | null = null;
    private sandbox: Sandbox | null = null;

    private callbacks: {
        StateUpdated?: StateUpdatedCallback | null,
        StatsUpdated?: StatsUpdatedCallback | null
    } = {};

    constructor(host: string) {
        const wsUrl = `https://${host}:3010`;

        this.socket = io(wsUrl, {
            reconnection: false,
            autoConnect: false,
            transports: ['websocket', 'polling'],
        });

        this.bindSocketEvents();
        this.player = this.createGuestPlayer();
    }

    createGuestPlayer(): Player {
        const getRandomNickname = () => {
            const randomId = (Math.floor(Math.random() * 90000) + 11111);
            return `guest-${randomId}`;
        }
        return this.createPlayer({
            nickname: localStorage.getItem('hexgame:nickname') || getRandomNickname(),
            lang: getUserLang(),
            externalId: null
        });
    }

    getMatch(): Match | null {
        return this.match;
    }

    connect(): Promise<void> {
        return new Promise<void>(resolve => {
            this.setConnecting();
            this.socket.auth = {
                info: this.player.info,
            };
            this.socket.connect();

            this.socket.once('game:connected', ({ isAdmin }) => {
                if (isAdmin) this.player.setAdmin();
                resolve();
            });
        });
    }

    bindSocketEvents() {
        this.socket.on("connect_error", e => {
            alert(e.message);
            this.setLoggedOut();
        });

        this.socket.on("disconnect", () => {
            this.setLoggedOut();
        });

        this.socket.on('game:match:start', ({ playerTag, map, scores, maxTurnTime }) => {
            this.startMatch(new Match(this, {
                map,
                playerTag,
                initialScores: scores,
                maxTurnTime
            }));
        });

        this.socket.on('game:match:start-spectating', ({ currentPlayer, map, scores, maxTurnTime }) => {
            this.startMatch(new SpectateMatch(this, {
                map,
                currentPlayer,
                initialScores: scores,
                maxTurnTime
            }));
        });

        this.socket.on('game:stats', (stats: GameServerStats) => {
            if (this.callbacks.StatsUpdated) this.callbacks.StatsUpdated(stats);
        });
    }

    startMatch(match: Match) {
        this.match = match;

        this.match.whenOver(() => {
            this.setOver();
            this.match?.unbindSocketEvents();
            this.match = null;
        });

        this.setStarted();
    }

    async connectAndStart() {
        await this.connect();

        setTimeout(() => {
            if (this.player.isAdmin()) {
                return this.setManagement();
            }

            this.setSearchingGame();
        }, 500);
    }

    async searchAndStart(nickname?: string) {
        setTimeout(() => this.setSearchingGame(), 600);
    }

    startSpectating(matchId: string) {
        this.socket.emit('game:spectate-request', { matchId });
    }

    createPlayer(info: PlayerInfo) {
        return this.player = new Player(info);
    }

    getPlayer(): Player {
        return this.player;
    }

    whenStatsUpdated(callback: StatsUpdatedCallback) {
        this.callbacks.StatsUpdated = callback;
    }

    whenStateUpdated(callback: StateUpdatedCallback) {
        this.callbacks.StateUpdated = callback;
    }

    private setState(state: GameState) {
        this.state = state;
        if (this.callbacks.StateUpdated) {
            this.callbacks.StateUpdated(state);
        }
    }

    getState(): GameState {
        return this.state;
    }

    isLoggedOut(): boolean {
        return this.state === GameState.LoggedOut;
    }

    setLoggedOut() {
        this.setState(GameState.LoggedOut);
        if (this.socket.connected) this.socket.disconnect();
        if (this.match) this.match = null;
    }

    isConnecting(): boolean {
        return this.state === GameState.Connecting;
    }

    setConnecting() {
        this.setState(GameState.Connecting);
    }

    isSearchingGame(): boolean {
        return this.state === GameState.SearchingGame;
    }

    setSearchingGame() {
        this.setState(GameState.SearchingGame);
        this.socket.emit('game:search-request');
    }

    isSandbox(): boolean {
        return this.state === GameState.Sandbox;
    }

    getSandbox() {
        return this.sandbox;
    }

    setSandbox() {
        this.sandbox = new Sandbox(this);
        this.setState(GameState.Sandbox);
    }

    startSandbox() {
        this.setSandbox();
    }

    isTutorial(): boolean {
        return this.state === GameState.Tutorial;
    }

    setTutorial() {
        this.setState(GameState.Tutorial);
    }

    isManagement(): boolean {
        return this.state === GameState.Management;
    }

    setManagement() {
        this.setState(GameState.Management);
        this.askForUpdatedStats();
    }

    isStarted() {
        return this.state === GameState.Started;
    }

    setStarted() {
        this.setState(GameState.Started);
    }

    isOver() {
        return this.state === GameState.Over;
    }

    setOver() {
        this.setState(GameState.Over);
    }

    toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    askForUpdatedStats() {
        this.socket.emit('game:stats-request');
    }

}