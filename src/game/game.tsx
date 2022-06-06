type CellsUpdatedCallback = (cells: number[]) => void

export class Game {

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

    private callbacks: {
        CellsUpdated?: CellsUpdatedCallback | null
    } = {};

    getCellCoordinates(id: number): { x: number, y: number } {
        return {
            x: id % this.width,
            y: id / this.width
        }
    }

    getCells(): number[] {
        return this.cells;
    }

    onCellClick(id: number) {
        this.updateCell(id, 1 - this.cells[id]);
    }

    updateCell(id: number, value: number) {
        if (this.cells[id] == value) return;
        this.cells[id] = value;
        if (this.callbacks.CellsUpdated) {
            console.log(this.cells);
            this.callbacks.CellsUpdated(this.cells);
        }
    }

    whenCellsUpdated(callback: CellsUpdatedCallback) {
        this.callbacks.CellsUpdated = callback;
    }

}