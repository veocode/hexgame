import { io, Socket } from "socket.io-client";
import { HexMapCell } from "../shared/hexmapcell";
import { HexMap, HexNeighborLevel } from '../shared/hexmap';
import { Player, PlayerColorsList, PlayerHasNoMovesReasons, PlayerTag } from '../shared/player';
import { getLocaleTexts } from "./locales";
import Timer from "./timer";

const texts = getLocaleTexts();

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

enum GameMoveState {
    MyMove = 0,
    OpponentMove
}

export enum SandboxTools {
    EmptyNone = 9,
    Player1,
    Player2
}

const cellAnimationTime: number = 400;

export type GameScoreList = {
    own: {
        nickname: string,
        score: number
    },
    opponent: {
        nickname: string,
        score: number
    }
};

export type ServerScoreList = {
    [key: number]: {
        nickname: string,
        score: number
    }
};

export interface GameResult {
    isWinner: boolean,
    isWithdraw: boolean,
    isNoMoves: boolean,
    scores: ServerScoreList
}

export interface GameStateMessage {
    text: string,
    className?: string
}

export interface GameServerStats {
    players: number,
    bots: number,
    admins: number,
    matches: number
}

type MapUpdatedCallback = (cells: HexMapCell[]) => void
type StateUpdatedCallback = (state: GameState) => void;
type StateMessageUpdatedCallback = (stateMessage: GameStateMessage) => void;
type MatchScoreUpdatedCallback = (scores: GameScoreList) => void;
type MatchOverCallback = (result: GameResult) => void;
type StatsUpdatedCallback = (result: GameServerStats) => void;


export class Game {

    private socket: Socket;

    private map: HexMap;
    private player: Player;

    private state: GameState = GameState.LoggedOut;
    private moveState: GameMoveState = GameMoveState.OpponentMove;
    private selectedCell: HexMapCell | null = null;
    private result: GameResult | null = null;
    private scores: GameScoreList | null = null;

    private maxTurnTime: number = 30;
    private turnTimer: Timer = new Timer();

    private sandboxTool: SandboxTools = SandboxTools.EmptyNone;

    private callbacks: {
        MapUpdated?: MapUpdatedCallback | null,
        StateUpdated?: StateUpdatedCallback | null,
        StateMessageUpdated?: StateMessageUpdatedCallback | null,
        MatchScoreUpdated?: MatchScoreUpdatedCallback | null,
        MatchOver?: MatchOverCallback | null,
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

        this.map = this.createMap();
        this.player = this.createPlayer();
    }

    connect(nickname: string): Promise<void> {
        return new Promise<void>(resolve => {
            this.setConnecting();
            this.socket.auth = { nickname };
            this.socket.connect();

            this.socket.once('game:connected', ({ clientId, isAdmin }) => {
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
            this.maxTurnTime = maxTurnTime;
            this.setStarted();
            this.player.setTag(playerTag);
            this.map.deserealize(map);
            this.redrawMap();
            this.updateMatchScores(scores);
        })

        this.socket.on('game:match:move-request', () => {
            this.turnTimer.start(this.maxTurnTime, () => {
                this.updateStateMessage({
                    text: this.turnTimer.formatLeft(texts.YourTurn),
                })
            });

            this.setMyMove();
        })

        this.socket.on('game:match:move-pending', () => {
            this.turnTimer.start(this.maxTurnTime, () => {
                this.updateStateMessage({
                    text: this.turnTimer.formatLeft(texts.OpponentTurn),
                })
            });

            this.setOpponentMove();
            this.map.resetHighlight();
            this.redrawMap();
        })

        this.socket.on('game:match:move-by-opponent', async ({ fromId, toId }) => {
            this.map.resetHighlight();
            await this.makeMove(fromId, toId, true);
        })

        this.socket.on('game:match:move-cell-selected', async ({ id }) => {
            this.map.resetHighlight();
            if (id) this.map.highlightCellNeighbors(id);
            this.redrawMap();
        })

        this.socket.on('game:match:no-moves', async ({ loserTag, reasonType }) => {
            this.turnTimer.stop();
            this.map.resetHighlight();

            const reasons: { [key: string]: string } = {}
            reasons[PlayerHasNoMovesReasons.Left] = texts.OpponentLeft;
            reasons[PlayerHasNoMovesReasons.Eliminated] = texts.OpponentEliminated;
            reasons[PlayerHasNoMovesReasons.NoMoves] = texts.OpponentNoMoves;

            const winnerTag = loserTag === this.player.getTag() ? this.player.getOpponentTag() : this.player.getTag();
            const stateText = loserTag === this.player.getTag()
                ? texts.NoMoves
                : reasons[reasonType];

            this.updateStateMessage({ text: stateText });

            setTimeout(() => {
                const emptyCells = this.getMap().getCells().filter(cell => cell.isEmpty());
                this.shuffleArray(emptyCells);

                const occupyNextCell = () => {
                    if (emptyCells.length === 0) return;
                    const cell = emptyCells.pop();
                    cell?.setOccupiedBy(winnerTag);
                    this.redrawMap();
                    setTimeout(() => occupyNextCell(), 100);
                }

                occupyNextCell();
            }, 500);
        })

        this.socket.on('game:match:scores', ({ scores }) => {
            this.updateMatchScores(scores);
        })

        this.socket.on('game:match:over', ({ isWinner, isWithdraw, isNoMoves, scores }) => {
            this.turnTimer.stop();
            this.setOver({
                isWinner,
                isWithdraw,
                isNoMoves,
                scores
            });
        })

        this.socket.on('game:stats', (stats: GameServerStats) => {
            if (this.callbacks.StatsUpdated) this.callbacks.StatsUpdated(stats);
        });
    }

    async connectAndStart(nickname: string) {
        await this.connect(nickname);

        setTimeout(() => {
            if (this.player.isAdmin()) {
                return this.setManagement();
            }

            this.setSearchingGame();
        }, 600);
    }

    async searchAndStart(nickname?: string) {
        setTimeout(() => this.setSearchingGame(), 600);
    }

    startSandbox() {
        this.setSandbox();
    }

    getSandboxTool(): SandboxTools {
        return this.sandboxTool;
    }

    setSandboxTool(tool: number) {
        this.sandboxTool = tool;
    }

    getPlayerColors(): PlayerColorsList {
        if (this.player.getTag() === PlayerTag.Player1) {
            return {
                1: 'own',
                2: 'enemy',
            }
        }

        return {
            2: 'own',
            1: 'enemy',
        }
    }

    createMap(): HexMap {
        return new HexMap((cell: HexMapCell) => {
            const chance = Math.random();
            if (chance >= 0.15) {
                cell.setEmpty();
                if (chance >= 0.9) {
                    const randomPlayer = [PlayerTag.Player1, PlayerTag.Player2][Math.floor(Math.random() * 2)];
                    cell.setOccupiedBy(randomPlayer);
                }
            }
        });
    }

    createPlayer(): Player {
        const player = new Player();
        player.setTag(PlayerTag.Player1);
        return player;
    }

    getMap(): HexMap {
        return this.map;
    }

    async onCellClick(id: number) {

        const cell = this.map.getCell(id);

        if (this.isSandbox()) {
            return this.onSandboxCellClick(cell);
        }

        if (!this.isMyMove()) {
            return;
        }

        if (cell.isNone() || (!cell.isEmpty() && !cell.isOccupiedBy(this.player.getTag()))) {
            this.map.resetHighlight();
            this.selectedCell = null;
        }

        if (cell.isOccupiedBy(this.player.getTag())) {
            if (!this.selectedCell || this.selectedCell.id !== cell.id) {
                this.selectCell(cell);
            }
        }

        if (cell.isEmpty() && this.selectedCell) {
            this.map.resetHighlight();
            await this.makeMove(this.selectedCell.id, cell.id);
            this.selectedCell = null;
        }

        if (this.selectedCell === null) {
            this.socket.emit('game:match:move-cell-selected', { id: null });
        }

        this.redrawMap();
    }

    onSandboxCellClick(cell: HexMapCell) {

        if (this.sandboxTool === SandboxTools.EmptyNone) {
            if (cell.isOccupied()) cell.setEmpty();
            if (cell.isEmpty() || cell.isNone()) cell.toggleNoneEmpty();
        }

        if (this.sandboxTool === SandboxTools.Player1 && !cell.isNone()) {
            if (cell.isOccupiedBy(PlayerTag.Player1)) {
                cell.setEmpty();
            } else {
                cell.setOccupiedBy(PlayerTag.Player1);
            }
        }

        if (this.sandboxTool === SandboxTools.Player2 && !cell.isNone()) {
            if (cell.isOccupiedBy(PlayerTag.Player2)) {
                cell.setEmpty();
            } else {
                cell.setOccupiedBy(PlayerTag.Player2);
            }
        }

        this.redrawMap();
    }

    selectCell(cell: HexMapCell) {
        if (!cell.isOccupiedBy(this.player.getTag())) return;

        if (this.selectedCell) this.map.resetHighlight();
        this.selectedCell = cell;
        this.map.highlightCellNeighbors(cell.id);
        this.socket.emit('game:match:move-cell-selected', { id: cell.id });
    }

    makeMove(fromId: number, toId: number, isOpponent: boolean = false): Promise<boolean> {
        return new Promise<boolean>(async resolve => {
            const srcCell = this.map.getCell(fromId);
            const dstCell = this.map.getCell(toId);

            if (!srcCell.isOccupied()) return resolve(false);
            if (!dstCell.isEmpty()) return resolve(false);

            const level = this.map.getCellNeighborLevel(srcCell.id, dstCell.id);
            if (!level) return resolve(false);

            const player = srcCell.getOccupiedBy();
            if (!player) return resolve(false);

            if (!isOpponent) this.socket.emit('game:match:move-response', { fromId, toId });

            if (level === HexNeighborLevel.Near) {
                await this.occupyCellByPlayer(dstCell.id, player);
            }

            if (level === HexNeighborLevel.Far) {
                await this.freeCell(srcCell.id);
                await this.occupyCellByPlayer(dstCell.id, player);
            }

            const hostileIds = this.map.getCellHostileNeighbors(dstCell.id);
            if (hostileIds.length > 0) {
                await this.freeCells(hostileIds);
                await this.occupyCellsByPlayer(hostileIds, player);
            }

            resolve(true);
        });
    }

    occupyCellsByPlayer(ids: number[], player: PlayerTag): Promise<void> {
        return new Promise<void>(resolve => {
            ids.forEach(id => this.map.occupyCell(id, player));
            this.redrawMap();
            setTimeout(resolve, cellAnimationTime);
        });
    }

    occupyCellByPlayer(id: number, player: PlayerTag): Promise<void> {
        return new Promise<void>(resolve => {
            if (this.map.occupyCell(id, player)) {
                this.redrawMap();
                setTimeout(resolve, cellAnimationTime);
            } else {
                resolve();
            }
        });
    }

    freeCells(ids: number[]): Promise<void> {
        return new Promise<void>(resolve => {
            ids.forEach(id => this.map.freeCell(id));
            this.redrawMap();
            setTimeout(() => {
                ids.forEach(id => this.map.emptyCell(id));
                resolve();
            }, cellAnimationTime);
        });
    }

    freeCell(id: number): Promise<void> {
        return new Promise<void>(resolve => {
            if (this.map.freeCell(id)) {
                this.redrawMap();
                setTimeout(() => {
                    this.map.emptyCell(id);
                    resolve();
                }, cellAnimationTime);
            } else {
                resolve();
            }
        });
    }

    redrawMap() {
        if (this.callbacks.MapUpdated) {
            this.callbacks.MapUpdated(this.map.getCells());
        }
    }

    whenMapUpdated(callback: MapUpdatedCallback) {
        this.callbacks.MapUpdated = callback;
    }

    whenStatsUpdated(callback: StatsUpdatedCallback) {
        this.callbacks.StatsUpdated = callback;
    }

    whenStateMessageUpdated(callback: StateMessageUpdatedCallback) {
        this.callbacks.StateMessageUpdated = callback;
    }

    updateStateMessage(stateMessage: GameStateMessage) {
        if (this.callbacks.StateMessageUpdated) {
            this.callbacks.StateMessageUpdated(stateMessage);
        }
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

    updateMatchScores(scores: ServerScoreList) {
        const gameScores = {
            own: { ...scores[this.player.getTag()] },
            opponent: { ...scores[this.player.getOpponentTag()] },
        }

        this.scores = gameScores;

        if (this.callbacks.MatchScoreUpdated) {
            this.callbacks.MatchScoreUpdated(gameScores);
        }
    }

    whenMatchScoreUpdated(callback: MatchScoreUpdatedCallback) {
        this.callbacks.MatchScoreUpdated = callback;
    }

    getScores(): GameScoreList | null {
        return this.scores;
    }

    whenMatchOver(callback: MatchOverCallback) {
        this.callbacks.MatchOver = callback;
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

    setSandbox() {
        this.setState(GameState.Sandbox);
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

    isMyMove() {
        return this.isStarted() && this.moveState === GameMoveState.MyMove;
    }

    setMyMove() {
        this.moveState = GameMoveState.MyMove;
        this.updateStateMessage({
            text: this.turnTimer.formatLeft(texts.YourTurn),
        })
    }

    isOpponentMove() {
        return this.isStarted() && this.moveState === GameMoveState.OpponentMove;
    }

    setOpponentMove() {
        this.moveState = GameMoveState.OpponentMove;
        this.updateStateMessage({
            text: this.turnTimer.formatLeft(texts.OpponentTurn),
        })
    }

    setOver(result: GameResult) {
        this.setState(GameState.Over);
        if (this.callbacks.MatchOver) {
            this.callbacks.MatchOver(result);
        }
        if (!result.isNoMoves) {
            this.updateStateMessage({
                text: texts.MatchOver,
            });
        }
        this.updateMatchScores(result.scores);
    }

    isOver() {
        return this.state === GameState.Over;
    }

    getResult(): GameResult | null {
        if (!this.isOver()) return null;
        return this.result;
    }

    shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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