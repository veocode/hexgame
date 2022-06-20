import { io, Socket } from "socket.io-client";
import { Player, PlayerTag } from '../shared/player';
import { Match } from "./match";
import { Sandbox } from "./sandbox";
import { SpectateMatch } from "./spectate";

const MaxNicknameLength = 12;

export enum GameState {
    LoggedOut = 0,
    Connecting,
    SearchingGame,
    Started,
    Over,
    Sandbox,
    Tutorial,
    Management
}

export interface GameServerMatchDescription {
    player1: string,
    player2: string
}

export interface GameServerStats {
    bots: number,
    players: {
        count: number,
        list: string[]
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

    private state: GameState = GameState.LoggedOut;

    private player: Player;
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

        this.player = this.createPlayer();
    }

    getMatch(): Match | null {
        return this.match;
    }

    connect(nickname: string): Promise<void> {
        return new Promise<void>(resolve => {
            this.setConnecting();
            this.socket.auth = { nickname };
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

        this.socket.on('game:match:start-spectating', ({ map, scores, maxTurnTime }) => {
            this.startMatch(new SpectateMatch(this, {
                map,
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

    async connectAndStart(nickname: string) {
        nickname = nickname.substring(0, MaxNicknameLength);
        await this.connect(nickname);

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

    createPlayer(): Player {
        const player = new Player();
        player.setTag(PlayerTag.Player1);
        return player;
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