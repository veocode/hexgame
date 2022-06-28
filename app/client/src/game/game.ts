import { io, Socket } from "socket.io-client";
import { Player, PlayerAuthInfo } from './player';
import { getLocaleTexts, getUserLang } from "./locales";
import { Match } from "./match";
import { Sandbox } from "./sandbox";
import { SpectateMatch } from "./spectate";

const texts = getLocaleTexts();

export enum GameState {
    Loading,
    Connecting,
    LoggedOut,
    Lobby,
    SearchingGame,
    Started,
    Over,
    Sandbox,
    Tutorial,
    LinkReady,
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

interface TopPlayerInfo {
    place: number,
    name: string,
    points: number,
    avatarUrl?: string
}

type TopPlayersDict = { [period: string]: TopPlayerInfo[] };

interface LobbyData {
    topPlayers: TopPlayersDict,
    score: {
        total: number,
        today: number
    }
}

type StateUpdatedCallback = (state: GameState) => void;
type StatsUpdatedCallback = (result: GameServerStats) => void;
type TopPlayersUpdatedCallback = (topPlayers: TopPlayersDict) => void;

export class Game {

    public readonly queryParams = new URLSearchParams(window.location.search);

    public readonly socket: Socket;
    public linkedGameUrl: string = '';

    private state: GameState = GameState.Loading;
    private lobbyData: LobbyData | null = null;

    protected player: Player;
    private match: Match | null = null;
    private sandbox: Sandbox | null = null;

    private callbacks: {
        StateUpdated?: StateUpdatedCallback | null,
        StatsUpdated?: StatsUpdatedCallback | null,
        TopPlayersUpdated?: TopPlayersUpdatedCallback | null
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
        const guestId = (Math.floor(Math.random() * 90000) + 11111);
        const guestName = `guest-${guestId}`;

        const nickname = localStorage.getItem('hexgame:nickname') || guestName;
        let sourceId = localStorage.getItem('hexgame:guest-id');

        if (!sourceId) {
            sourceId = `g-${guestId}-${Date.now()}`;
            localStorage.setItem('hexgame:guest-id', sourceId);
        }

        return this.createPlayer({
            sourceId,
            nickname,
            name: nickname,
            lang: getUserLang()
        }, true);
    }

    getMatch(): Match | null {
        return this.match;
    }

    connect() {
        this.setConnecting();
        this.socket.connect();
        this.socket.once('game:connected', () => this.setLoggedOut());
    }

    login() {
        this.setLoading();
        this.socket.emit('game:login', { authInfo: this.player.authInfo });
        this.socket.once('game:logged', ({ isAdmin, topPlayers, score }) => {
            if (isAdmin) {
                this.player.setAdmin();
            }

            const linkedGameId = this.queryParams.get('g');
            if (linkedGameId) {
                this.setLoading();
                this.socket.emit('game:link:join', { gameId: linkedGameId });
                return;
            }

            if (isAdmin) {
                this.player.setAdmin();
                this.setManagement();
                return;
            }

            this.setLobby({
                topPlayers,
                score
            });
        });
    }

    bindSocketEvents() {
        this.socket.on("connect_error", e => {
            this.connect();
        });

        this.socket.on("disconnect", () => {
            this.connect();
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

        this.socket.on('game:link:ready', ({ url }) => {
            this.linkedGameUrl = url;
            this.setLinkReady();
        });

        this.socket.on('game:link:not-found', () => {
            this.setLoading();
            alert(texts.LinkNotFound);
            window.location.href = '/';
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
        }, 200);
    }

    async searchAndStart(nickname?: string) {
        setTimeout(() => this.setSearchingGame(), 600);
    }

    startSpectating(matchId: string) {
        this.socket.emit('game:spectate-request', { matchId });
    }

    stopSpectating() {
        this.socket.emit('game:spectate-stop');
        this.setManagement();
    }

    startLinkedGame() {
        this.setLoading();
        this.socket.emit('game:link:create');
    }

    cancelLinkedGame() {
        this.socket.emit('game:link:cancel');
        this.setLobby();
    }

    createPlayer(info: PlayerAuthInfo, isGuest: boolean = false) {
        return this.player = new Player(info, isGuest);
    }

    getPlayer(): Player {
        return this.player;
    }

    whenTopPlayersUpdated(callback: TopPlayersUpdatedCallback) {
        this.callbacks.TopPlayersUpdated = callback;
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
        if (this.match) this.match = null;
    }

    isConnecting(): boolean {
        return this.state === GameState.Connecting;
    }

    setConnecting() {
        this.setState(GameState.Connecting);
        if (this.socket.connected) this.socket.disconnect();
    }

    isLoading(): boolean {
        return this.state === GameState.Loading;
    }

    setLoading() {
        this.setState(GameState.Loading);
    }

    isLobby(): boolean {
        return this.state === GameState.Lobby;
    }

    setLobby(lobbyData: LobbyData | null = null) {
        this.setLobbyData(lobbyData);

        if (!lobbyData) {
            this.setLoading();
            this.socket.emit('game:lobby');
            this.socket.once('game:lobby', (lobbyData) => {
                this.setLobby(lobbyData);
            })
        } else {
            this.setState(GameState.Lobby);
        }
    }

    setLobbyData(lobbyData: LobbyData | null) {
        this.lobbyData = lobbyData;
    }

    getLobbyData(): LobbyData | null {
        return this.lobbyData;
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

    isLinkReady(): boolean {
        return this.state === GameState.LinkReady;
    }

    setLinkReady() {
        this.setState(GameState.LinkReady);
    }

    isManagement(): boolean {
        return this.state === GameState.Management;
    }

    setManagement() {
        this.setState(GameState.Management);
        this.askForUpdatedAdminStats();
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

    askForUpdatedAdminStats() {
        this.socket.emit('game:stats-request');
    }

}