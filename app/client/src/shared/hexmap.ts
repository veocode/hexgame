import { PlayerTag } from "./types";
import { HexMapCell, HexCellHightlightType } from "./hexmapcell";
import { Point2D } from './types';

export enum HexNeighborLevel {
    Near = 1,
    Far = 2,
}

type HexNeighborsByLevel = { [key: number]: number[] };
type HexNeighborsCache = { [key: number]: HexNeighborsByLevel };
type HexCellInitCallback = (cell: HexMapCell) => void;

export class HexMap {

    private width: number = 9;
    private height: number = 9;

    private cells: HexMapCell[] = [];
    private neighborsCache: HexNeighborsCache = {};

    constructor(cellInitCallback: HexCellInitCallback | null = null) {
        let id = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = new HexMapCell(id++);
                if (cellInitCallback) cellInitCallback(cell);
                this.cells.push(cell);
            }
        }

        this.initNeighborsCache();
    }

    validate(): boolean {
        const pieces: { [player: number]: number } = {};
        pieces[PlayerTag.Player1] = 0;
        pieces[PlayerTag.Player2] = 0;

        const tags = [PlayerTag.Player1, PlayerTag.Player2];

        this.getCells().forEach(cell => {
            tags.forEach(tag => {
                if (cell.isOccupiedBy(tag)) {
                    const neighbors = this.getCellEmptyNeighbors(cell.id);
                    const hasEmptyNear = neighbors[HexNeighborLevel.Near].length > 0;
                    const hasEmptyFar = neighbors[HexNeighborLevel.Far].length > 0;
                    if (hasEmptyFar && hasEmptyNear) pieces[tag] += 1;
                }
            })
        });

        console.log('pieces', pieces)

        return pieces[PlayerTag.Player1] > 0 && pieces[PlayerTag.Player2] > 0;
    }

    clone(): HexMap {
        const clone = new HexMap();
        clone.setCells(this.getCells());
        return clone;
    }

    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        return this.height;
    }

    initNeighborsCache() {
        this.cells.forEach(cell => {
            this.neighborsCache[cell.id] = this.getCellNeighbors(cell.id);
        });
    }

    getCell(id: number): HexMapCell {
        return this.cells[id];
    }

    getCells(): HexMapCell[] {
        return [...this.cells];
    }

    setCells(cells: HexMapCell[]) {
        this.cells = [...cells];
    }

    isCellExists(id: number): boolean {
        return !this.cells[id].isNone();
    }

    isCellEmpty(id: number): boolean {
        return this.cells[id].isEmpty();
    }

    isCellOccupied(id: number): boolean {
        return this.cells[id].isOccupied();
    }

    isCellOccupiedBy(id: number, player: PlayerTag): boolean {
        return this.cells[id].isOccupiedBy(player);
    }

    getCellsOccupiedByPlayerCount(player: PlayerTag): number {
        let count = 0;
        this.getCells().forEach(cell => {
            if (!cell.isOccupiedBy(player)) return;
            count += 1;
        });
        return count;
    }

    getCellCoordinatesById(id: number): Point2D {
        return {
            x: (id % this.width) | 0,
            y: (id / this.width) | 0
        }
    }

    getCellIdByCoordinates(x: number, y: number): number {
        return x + this.width * y;
    }

    getCellNeighborLevel(id: number, neighborId: number): HexNeighborLevel | null {
        const allNeighborsList = this.getCellNeighbors(id);
        if (allNeighborsList[HexNeighborLevel.Near].includes(neighborId)) return HexNeighborLevel.Near;
        if (allNeighborsList[HexNeighborLevel.Far].includes(neighborId)) return HexNeighborLevel.Far;
        return null;
    }

    getCellHostileNeighbors(id: number, hostileToTag: PlayerTag | null = null): number[] {
        const cell = this.cells[id];

        if (!hostileToTag) hostileToTag = cell.getOccupiedBy();
        const nearestNeighborIds = this.getCellNearestNeighborIds(id);
        const hostileIds: number[] = [];

        nearestNeighborIds.forEach(nearId => {
            if (this.cells[nearId].isHostileTo(hostileToTag)) {
                hostileIds.push(nearId);
            }
        });

        return hostileIds;
    }

    getCellAllyNeighbors(id: number, allyToTag: PlayerTag | null = null): number[] {
        const cell = this.cells[id];
        if (!cell.isOccupied) return [];

        if (!allyToTag) allyToTag = cell.getOccupiedBy();
        const nearestNeighborIds = this.getCellNearestNeighborIds(id);
        const allyIds: number[] = [];

        nearestNeighborIds.forEach(nearId => {
            if (this.cells[nearId].isOccupiedBy(allyToTag ?? 0)) {
                allyIds.push(nearId);
            }
        });

        return allyIds;
    }

    isCellCanBeAttacked(id: number, attackedByTag: PlayerTag, exceptIds: number[] = []): boolean {
        let isCanBeAttacked: boolean = false;
        Object.values(this.getCellNeighbors(id)).forEach(neighborIds => {
            if (isCanBeAttacked) return;
            neighborIds.forEach(neighborId => {
                if (isCanBeAttacked) return;
                if (exceptIds.includes(neighborId)) return;
                isCanBeAttacked = this.cells[neighborId].isOccupiedBy(attackedByTag);
            })
        })
        return isCanBeAttacked;
    }

    getCellEmptyNeighbors(id: number): HexNeighborsByLevel {
        const emptyNeighborsList: HexNeighborsByLevel = {};
        emptyNeighborsList[HexNeighborLevel.Near] = [];
        emptyNeighborsList[HexNeighborLevel.Far] = [];

        const allNeighborsList = this.getCellNeighbors(id);

        allNeighborsList[HexNeighborLevel.Near].forEach(nearId => {
            if (this.isCellEmpty(nearId)) {
                emptyNeighborsList[HexNeighborLevel.Near].push(nearId);
            }
        });

        allNeighborsList[HexNeighborLevel.Far].forEach(farId => {
            if (id === farId) return;
            if (this.isCellEmpty(farId)) {
                emptyNeighborsList[HexNeighborLevel.Far].push(farId);
            }
        });

        return emptyNeighborsList
    }

    getCellNeighbors(id: number): HexNeighborsByLevel {
        if (id in this.neighborsCache) { return this.neighborsCache[id]; }

        const neighborList: HexNeighborsByLevel = {};
        neighborList[HexNeighborLevel.Near] = [];
        neighborList[HexNeighborLevel.Far] = [];

        const visitedIds: number[] = [id];
        const nearestNeighborIds = this.getCellNearestNeighborIds(id);
        nearestNeighborIds.forEach(nearId => {
            neighborList[HexNeighborLevel.Near].push(nearId);
            visitedIds.push(nearId);
        });

        nearestNeighborIds.forEach(nearId => {
            const farNeighborIds = this.getCellNearestNeighborIds(nearId);
            farNeighborIds.forEach(farId => {
                if (id === farId) return;
                if (visitedIds.includes(farId)) return;

                neighborList[HexNeighborLevel.Far].push(farId);
                visitedIds.push(farId);
            });
        });

        return neighborList
    }

    getCellNearestNeighborIds(id: number): number[] {
        if (id in this.neighborsCache) { return this.neighborsCache[id][HexNeighborLevel.Near]; }

        const neighborIds: number[] = [];
        const neighborPositions: Point2D[] = [];
        const pos: Point2D = this.getCellCoordinatesById(id);

        if (pos.y % 2 !== 0) {
            if (pos.y > 0)
                neighborPositions.push({ x: pos.x, y: pos.y - 1 })
            if (pos.x > 0)
                neighborPositions.push({ x: pos.x - 1, y: pos.y })
            if (pos.y < this.height - 1)
                neighborPositions.push({ x: pos.x, y: pos.y + 1 })
            if (pos.y > 0 && pos.x < this.width - 1)
                neighborPositions.push({ x: pos.x + 1, y: pos.y - 1 })
            if (pos.x < this.width - 1)
                neighborPositions.push({ x: pos.x + 1, y: pos.y })
            if (pos.y < this.height - 1 && pos.x < this.width - 1)
                neighborPositions.push({ x: pos.x + 1, y: pos.y + 1 })
        } else {
            if (pos.x > 0 && pos.y > 0)
                neighborPositions.push({ x: pos.x - 1, y: pos.y - 1 })
            if (pos.x > 0)
                neighborPositions.push({ x: pos.x - 1, y: pos.y })
            if (pos.x > 0 && pos.y < this.height - 1)
                neighborPositions.push({ x: pos.x - 1, y: pos.y + 1 })
            if (pos.y > 0)
                neighborPositions.push({ x: pos.x, y: pos.y - 1 })
            if (pos.x < this.width - 1)
                neighborPositions.push({ x: pos.x + 1, y: pos.y })
            if (pos.y < this.height - 1)
                neighborPositions.push({ x: pos.x, y: pos.y + 1 })
        }

        neighborPositions.forEach(neighborPosition => {
            const neighborId = this.getCellIdByCoordinates(neighborPosition.x, neighborPosition.y);
            neighborIds.push(neighborId);
        })

        return neighborIds;
    }

    resetHighlight() {
        this.cells.forEach(cell => {
            if (cell.isHighlighted()) cell.highlightOff();
        })
    }

    highlightCell(id: number, type: HexCellHightlightType) {
        this.cells[id].setHighlightType(type);
    }

    highlightCellNeighbors(id: number) {
        const neighborList = this.getCellEmptyNeighbors(id);
        neighborList[HexNeighborLevel.Near].forEach(cellId => this.highlightCell(cellId, HexCellHightlightType.Near))
        neighborList[HexNeighborLevel.Far].forEach(cellId => this.highlightCell(cellId, HexCellHightlightType.Far))
        this.highlightCell(id, HexCellHightlightType.Center);
    }

    occupyCell(id: number, player: PlayerTag): boolean {
        const cell = this.cells[id];
        cell.setOccupiedBy(player);
        return true;
    }

    freeCell(id: number): boolean {
        const cell = this.cells[id];
        cell.setFreed();
        return true;
    }

    emptyCell(id: number): boolean {
        const cell = this.cells[id];
        cell.setEmpty();
        return true;
    }

    serialize(): number[] {
        const serializedMap: number[] = [];

        this.cells.forEach(cell => {
            let cellValue = 0;
            if (cell.isEmpty()) cellValue = 1;
            if (cell.isOccupiedBy(PlayerTag.Player1)) cellValue = 2;
            if (cell.isOccupiedBy(PlayerTag.Player2)) cellValue = 3;
            serializedMap.push(cellValue);
        });

        return serializedMap;
    }

    deserealize(serializedMap: number[]) {
        serializedMap.forEach((cellValue, id) => {
            const cell = this.getCell(id);
            if (cellValue === 0) cell.setNone();
            if (cellValue === 1) cell.setEmpty();
            if (cellValue === 2) cell.setOccupiedBy(PlayerTag.Player1);
            if (cellValue === 3) cell.setOccupiedBy(PlayerTag.Player2);
        });
        return this;
    }

}