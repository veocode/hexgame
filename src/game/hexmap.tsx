import { Point } from "../types/utils";

type HexNeighborLevelsList = { [key: number]: number }; // id: level

export class HexMap {

    private width: number = 9;
    private height: number = 9;

    private cells: number[] = [
        0, 1, 0, 1, 0, 1, 0, 1, 0,
        1, 0, 1, 1, 1, 1, 0, 1, 0,
        1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 0, 1, 1, 0, 1, 1, 1,
        1, 1, 0, 1, 0, 1, 0, 1, 1,
        1, 1, 0, 1, 1, 0, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 0, 1, 0,
        0, 1, 0, 1, 0, 1, 0, 1, 0
    ];

    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        return this.height;
    }

    getCells(): number[] {
        return [...this.cells];
    }

    updateCell(id: number, value: number) {
        if (this.cells[id] === value) return;
        this.cells[id] = value;
    }

    invertCell(id: number) {
        this.updateCell(id, 1 - this.cells[id]);
    }

    isCellEmpty(id: number): boolean {
        return this.cells[id] === 1;
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

    getCellEmptyNeighbors(id: number): HexNeighborLevelsList {
        const neighborList: HexNeighborLevelsList = {};
        const closestNeighborIds: number[] = this.getCellEmptyNearestNeighborIds(id);

        closestNeighborIds.forEach((closestId: number) => {
            neighborList[closestId] = 1;

            const farNeighborIds: number[] = this.getCellEmptyNearestNeighborIds(closestId);
            farNeighborIds.forEach(farId => {
                if (id === farId || farId in neighborList) return;
                neighborList[farId] = 2;
            });
        });

        return neighborList
    }

    getCellEmptyNearestNeighborIds(id: number): number[] {
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
            const neighborId: number = this.getCellIdByCoordinates(neighborPosition.x, neighborPosition.y);
            if (this.isCellEmpty(neighborId)) neighborIds.push(neighborId);
        })

        return neighborIds;
    }

}