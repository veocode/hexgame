import { HexMap } from "./hexmap";

type MapUpdatedCallback = (cells: number[]) => void

export class Game {

    private map: HexMap = new HexMap();

    private callbacks: {
        MapUpdated?: MapUpdatedCallback | null
    } = {};

    getMap(): HexMap {
        return this.map;
    }

    onCellClick(id: number) {
        this.invertCell(id);
    }

    invertCell(id: number) {
        // this.map.invertCell(id);
        console.log(this.map.getCellEmptyNeighbors(id));
        // if (this.callbacks.MapUpdated) {
        //     this.callbacks.MapUpdated(this.map.getCells());
        // }
    }

    whenMapUpdated(callback: MapUpdatedCallback) {
        this.callbacks.MapUpdated = callback;
    }

}