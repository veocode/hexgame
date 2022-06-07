import { HexMapCell } from "./hexmapcell";
import { HexMap } from "./hexmap";

type MapUpdatedCallback = (cells: HexMapCell[]) => void

export class Game {

    private map: HexMap = new HexMap();

    private callbacks: {
        MapUpdated?: MapUpdatedCallback | null
    } = {};

    getMap(): HexMap {
        return this.map;
    }

    onCellClick(id: number) {
        this.map.resetHighlight();
        this.map.highlightCellNeighbors(id);
        if (this.callbacks.MapUpdated) {
            this.callbacks.MapUpdated(this.map.getCells());
        }
    }

    invertCell(id: number) {
        // this.map.invertCell(id);
        console.log(this.map.getCellEmptyNeighbors(id));

    }

    whenMapUpdated(callback: MapUpdatedCallback) {
        this.callbacks.MapUpdated = callback;
    }

}