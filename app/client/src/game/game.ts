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

export enum GameInviteState {
    None,
    Pending,
    Declined,
    Accepted,
    Incoming,
    Expired,
}

export interface GameServerPlayerDescription {
    id: string,
    nickname: string,
    isBot: boolean,
    lang: string
}

export interface GameServerMatchDescription {
    id: string,
    player1: GameServerPlayerDescription,
    player2: GameServerPlayerDescription,
    hasBot: boolean
}

export interface GameServerStats {
    idlePlayers: GameServerPlayerDescription[],
    matches: GameServerMatchDescription[]
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

export interface GameInvite {
    playerId?: string,
    nickname?: string
}

type AlertCallback = (isShow: boolean) => void;
type StateUpdatedCallback = (state: GameState) => void;
type StatsUpdatedCallback = (result: GameServerStats) => void;
type InviteStateUpdatedCallback = (state: GameInviteState, message?: string) => void;
type TopPlayersUpdatedCallback = (topPlayers: TopPlayersDict) => void;

export class Game {

    public readonly queryParams = new URLSearchParams(window.location.search);

    public readonly socket: Socket;
    public linkedGameUrl: string = '';

    private state: GameState = GameState.Loading;
    private lobbyData: LobbyData | null = null;

    private inviteState: GameInviteState = GameInviteState.None;
    private invite: GameInvite = {};

    protected player: Player;
    private match: Match | null = null;
    private sandbox: Sandbox | null = null;

    private botDifficulty: string = 'normal';
    private botMap: number[] = [];

    private isAlerting: boolean = false;
    private alertMessage: string = '';

    private callbacks: {
        Alert?: AlertCallback | null,
        StateUpdated?: StateUpdatedCallback | null,
        StatsUpdated?: StatsUpdatedCallback | null,
        InviteStateUpdated?: InviteStateUpdatedCallback | null,
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

    alert(message: string) {
        this.isAlerting = true;
        this.alertMessage = message;
        this.callbacks.Alert?.call(this, true);
    }

    isAlert(): boolean {
        return this.isAlerting;
    }

    getAlertMessage(): string {
        return this.alertMessage;
    }

    cancelAlert() {
        this.isAlerting = false;
        this.callbacks.Alert?.call(this, false);
    }

    getMatch(): Match | null {
        return this.match;
    }

    whenAlert(callback: AlertCallback) {
        this.callbacks.Alert = callback;
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

            if (isAdmin) this.player.setAdmin();

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

        this.socket.on('game:match:start', ({ playerTag, map, scores, maxTurnTime, hasBot }) => {
            this.startMatch(new Match(this, {
                map,
                playerTag,
                initialScores: scores,
                maxTurnTime,
                hasBot
            }));
        });

        this.socket.on('game:match:start-spectating', ({ currentPlayer, map, scores, maxTurnTime, hasBot }) => {
            this.startMatch(new SpectateMatch(this, {
                map,
                currentPlayer,
                initialScores: scores,
                maxTurnTime,
                hasBot
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

        this.socket.on('game:invite-request', ({ playerId, nickname }) => {
            this.invite = {
                playerId,
                nickname
            };

            this.setInviteState(GameInviteState.Incoming);
        });

        this.socket.on('game:invite-response', ({ isAccepted, message }) => {
            if (isAccepted) {
                return this.setInviteState(GameInviteState.Accepted);
            }
            return this.setInviteState(GameInviteState.Declined, message);
        })

        this.socket.on('game:invite-expired', () => {
            return this.setInviteState(GameInviteState.Expired);
        })

        this.socket.on('game:invite-cancel', () => {
            return this.cancelInvite();
        })
    }

    startMatch(match: Match) {
        this.setLoading();
        setTimeout(() => {
            this.cancelInvite();
            this.match = match;

            this.match.whenOver(() => {
                this.setOver();
                this.match?.unbindSocketEvents();
                this.match = null;
            });

            this.setStarted();
        }, 200);
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

    async startWithBot(difficultyName?: string, map?: number[]) {
        if (difficultyName) this.botDifficulty = difficultyName;
        difficultyName = difficultyName || this.botDifficulty;
        if (map) this.botMap = map;
        map = map || this.botMap;
        this.setLoading();
        setTimeout(() => this.socket.emit('game:start-bot', { difficultyName, map }), 600);
    }

    startSpectating(matchId: string) {
        this.socket.emit('game:spectate-request', { matchId });
    }

    stopSpectating() {
        this.socket.emit('game:spectate-stop');
        this.setLobby();
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

    whenInviteStateUpdated(callback: InviteStateUpdatedCallback) {
        this.callbacks.InviteStateUpdated = callback;
    }

    private setInviteState(state: GameInviteState, message?: string) {
        this.inviteState = state;
        if (this.callbacks.InviteStateUpdated) {
            this.callbacks.InviteStateUpdated(state, message);
        }
    }

    getInviteState(): GameInviteState {
        return this.inviteState;
    }

    getInvite(): GameInvite {
        return this.invite;
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
            this.askForUpdatedLobbyStats();
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

    askForUpdatedLobbyStats() {
        this.socket.emit('game:stats-request');
    }

    sendInviteToPlayer(playerId: string, nickname: string) {
        if (this.inviteState !== GameInviteState.None) return;

        this.invite = {
            playerId,
            nickname
        };
        this.socket.emit('game:invite-request', this.invite);
        this.setInviteState(GameInviteState.Pending);
    }

    cancelInvite() {
        if (this.inviteState === GameInviteState.Pending) {
            this.socket.emit('game:invite-cancel');
        }
        this.setInviteState(GameInviteState.None);
    }

    acceptInvite() {
        if (this.inviteState === GameInviteState.Incoming) {
            this.socket.emit('game:invite-response', {
                toPlayerId: this.invite.playerId,
                isAccepted: true
            });

            this.setInviteState(GameInviteState.Accepted);
        }
    }

    declineInvite() {
        if (this.inviteState === GameInviteState.Incoming) {
            this.socket.emit('game:invite-response', {
                toPlayerId: this.invite.playerId,
                isAccepted: false
            });
            this.setInviteState(GameInviteState.None);
        }
    }

}