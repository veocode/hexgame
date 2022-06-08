import { HexMapCell } from "./hexmapcell";
import { HexMap } from "./hexmap";
import { PlayerTag } from "../types/utils";

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
        const randomPlayer = [PlayerTag.Player1, PlayerTag.Player2][Math.floor(Math.random() * 2)];

        this.map.occupyCell(id, randomPlayer);
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