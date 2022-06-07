import { Point } from "../types/utils";
import { HexCellHightlightType, HexMapCell } from "./hexmapcell";

enum NeighborLevel {
    Near = 1,
    Far = 2,
}

type HexNeighborsByLevel = { [key: number]: number[] };

export class HexMap {

    private width: number = 9;
    private height: number = 9;

    private cells: HexMapCell[] = [];

    constructor() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = new HexMapCell();
                const chance = Math.random();
                if (chance >= 0.15) {
                    cell.setEmpty();
                }
                this.cells.push(cell);
            }
        }
    }

    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        return this.height;
    }

    getCells(): HexMapCell[] {
        return [...this.cells];
    }

    isCellEmpty(id: number): boolean {
        return this.cells[id].isEmpty();
    }

    getCellCoordinatesById(id: number): Point {
        return {
            x: (id % this.width) | 0,
            y: (id / this.width) | 0
        }
    }

    getCellIdByCoordinates(x: number, y: number): number {
        return x + this.width * y;
    }

    getCellEmptyNeighbors(id: number): HexNeighborsByLevel {
        const neighborList: HexNeighborsByLevel = {};
        neighborList[NeighborLevel.Near] = [];
        neighborList[NeighborLevel.Far] = [];

        const visitedIds: number[] = [id];
        const nearestNeighborIds = this.getCellNearestNeighborIds(id);
        nearestNeighborIds.forEach(nearId => {
            if (this.isCellEmpty(nearId)) {
                neighborList[NeighborLevel.Near].push(nearId);
                visitedIds.push(nearId);
            }
        });

        nearestNeighborIds.forEach(nearId => {
            const farNeighborIds = this.getCellNearestNeighborIds(nearId);
            farNeighborIds.forEach(farId => {
                if (id === farId) return;
                if (visitedIds.includes(farId)) return;

                if (this.isCellEmpty(farId)) {
                    neighborList[NeighborLevel.Far].push(farId);
                    visitedIds.push(farId);
                }
            });
        });

        return neighborList
    }

    getCellNearestNeighborIds(id: number): number[] {
        const neighborIds: number[] = [];
        const neighborPositions: Point[] = [];
        const pos: Point = this.getCellCoordinatesById(id);

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
        neighborList[NeighborLevel.Near].forEach(cellId => this.highlightCell(cellId, HexCellHightlightType.Near))
        neighborList[NeighborLevel.Far].forEach(cellId => this.highlightCell(cellId, HexCellHightlightType.Far))
    }

}