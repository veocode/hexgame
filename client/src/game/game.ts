import { HexMapCell } from "./hexmapcell";
import { HexMap, HexNeighborLevel } from "./hexmap";
import { Player, PlayerTag } from "./player";

enum GameState {
    MakeMove = 0,
}

const cellAnimationTime: number = 400;

type MapUpdatedCallback = (cells: HexMapCell[]) => void

export class Game {

    private map: HexMap;
    private player: Player;

    private state: GameState = GameState.MakeMove;
    private selectedCell: HexMapCell | null = null;

    private callbacks: {
        MapUpdated?: MapUpdatedCallback | null
    } = {};

    constructor() {
        this.map = this.createMap();
        this.player = this.createPlayer();
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

        if (this.state === GameState.MakeMove) {

            if (cell.isOccupiedBy(this.player.getTag())) {
                if (!this.selectedCell || this.selectedCell.id !== cell.id) {
                    this.selectCell(cell);
                }
            }

            if (cell.isEmpty() && this.selectedCell) {
                this.map.resetHighlight();
                const isMoveSuccess = await this.makeMove(this.selectedCell.id, cell.id);
                if (isMoveSuccess) {
                    this.player.setTag(this.player.getTag() === 1 ? 2 : 1);
                }
                this.selectedCell = null;
            }

        }

        this.redrawMap();
    }

    selectCell(cell: HexMapCell) {
        if (!cell.isOccupiedBy(this.player.getTag())) return;

        if (this.selectedCell) this.map.resetHighlight();
        this.selectedCell = cell;
        this.map.highlightCellNeighbors(cell.id);
    }

    makeMove(fromId: number, toId: number): Promise<boolean> {
        return new Promise<boolean>(async resolve => {
            const srcCell = this.map.getCell(fromId);
            const dstCell = this.map.getCell(toId);

            if (!srcCell.isOccupied()) return resolve(false);
            if (!dstCell.isEmpty()) return resolve(false);

            const level = this.map.getCellNeighborLevel(srcCell.id, dstCell.id);
            if (!level) return resolve(false);

            const player = srcCell.getOccupiedBy();
            if (!player) return resolve(false);

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

}