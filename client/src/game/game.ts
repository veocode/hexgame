import { io, Socket } from "socket.io-client";
import { HexMapCell } from "../shared/hexmapcell";
import { HexMap, HexNeighborLevel } from '../shared/hexmap';
import { Player, PlayerTag } from '../shared/player';

export enum GameState {
    LoggedOut = 0,
    SearchingGame,
    Started,
    Finished
}

enum GameMoveState {
    MyMove = 0,
    OpponentMove
}

const cellAnimationTime: number = 400;

type MapUpdatedCallback = (cells: HexMapCell[]) => void
type StateUpdatedCallback = (state: GameState) => void;
type StateMessageUpdatedCallback = (stateMessage: GameStateMessage) => void;

export interface GameStateMessage {
    text: string,
    className?: string
};

export class Game {

    private socket: Socket = io('http://localhost:3010', { autoConnect: false });

    private map: HexMap;
    private player: Player;

    private state: GameState = GameState.LoggedOut;
    private moveState: GameMoveState = GameMoveState.OpponentMove;
    private selectedCell: HexMapCell | null = null;

    private callbacks: {
        MapUpdated?: MapUpdatedCallback | null,
        StateUpdated?: StateUpdatedCallback | null,
        StateMessageUpdated?: StateMessageUpdatedCallback | null
    } = {};

    constructor() {
        this.bindSocketEvents();

        this.map = this.createMap();
        this.player = this.createPlayer();
    }

    connect() {
        this.socket.on("connect_error", e => {
            console.log('error', e);
        });

        this.socket.connect();
    }

    bindSocketEvents() {
        this.socket.on('game:search-response', (...args: any[]) => {
            console.log('search response', ...args);
        })

        this.socket.on('game:match-start', ({ playerTag, map }) => {
            this.setStarted();
            this.player.setTag(playerTag);
            this.map.deserealize(map);
            this.redrawMap();
        })

        this.socket.on('game:match-move:request', () => {
            this.setMyMove();
        })

        this.socket.on('game:match-move:pending', () => {
            this.setOpponentMove();
            this.map.resetHighlight();
            this.redrawMap();
        })

        this.socket.on('game:match-move:opponent', async ({ fromId, toId }) => {
            await this.makeMove(fromId, toId, true);
        })
    }

    searchAndStart() {
        this.setSearchingGame();
        this.connect();
        this.socket.emit('game:search-request');
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

        this.map.resetHighlight();

        if (!this.isMyMove()) {
            this.redrawMap();
            return;
        }

        if (cell.isNone() || (!cell.isEmpty() && !cell.isOccupiedBy(this.player.getTag()))) {
            this.selectedCell = null;
        }

        if (cell.isOccupiedBy(this.player.getTag())) {
            if (!this.selectedCell || this.selectedCell.id !== cell.id) {
                this.selectCell(cell);
            }
        }

        if (cell.isEmpty() && this.selectedCell) {
            // const isMoveSuccess = 
            await this.makeMove(this.selectedCell.id, cell.id);
            // if (isMoveSuccess) {
            //     this.player.setTag(this.player.getTag() === 1 ? 2 : 1);
            // }
            this.selectedCell = null;
        }

        this.redrawMap();
    }

    selectCell(cell: HexMapCell) {
        if (!cell.isOccupiedBy(this.player.getTag())) return;

        if (this.selectedCell) this.map.resetHighlight();
        this.selectedCell = cell;
        this.map.highlightCellNeighbors(cell.id);
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

            if (!isOpponent) this.socket.emit('game:match-move:response', { fromId, toId });

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

    getState(): GameState {
        return this.state;
    }

    isLoggedOut(): boolean {
        return this.state === GameState.LoggedOut;
    }

    setLoggedOut() {
        this.setState(GameState.LoggedOut);
    }

    isSearchingGame(): boolean {
        return this.state === GameState.SearchingGame;
    }

    setSearchingGame() {
        this.setState(GameState.SearchingGame);
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
            text: 'Ваш ход',
        })
    }

    isOpponentMove() {
        return this.isStarted() && this.moveState === GameMoveState.OpponentMove;
    }

    setOpponentMove() {
        this.moveState = GameMoveState.OpponentMove;
        this.updateStateMessage({
            text: 'Ход противника',
        })
    }

}