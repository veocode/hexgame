import { HexMapCell } from "../shared/hexmapcell";
import { HexMap } from '../shared/hexmap';
import { PlayerColorsList, PlayerTag } from "../shared/types";
import { Game } from "./game";

const defaultMap: number[] = [
    0, 1, 1, 1, 1, 1, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 0,
    0, 1, 1, 1, 1, 1, 1, 1, 0
];

export enum SandboxTool {
    EmptyNone = 9,
    Player1,
    Player2
}

type MapUpdatedCallback = (cells: HexMapCell[]) => void;
type MapCountUpdatedCallback = (count: number) => void;

export class Sandbox {

    private map: HexMap;

    private tool: SandboxTool = SandboxTool.EmptyNone;

    private callbacks: {
        MapUpdated?: MapUpdatedCallback | null,
        MapCountUpdated?: MapCountUpdatedCallback | null
    } = {};

    constructor(
        private game: Game,
    ) {
        this.map = this.createMap();
        this.bindSocketEvents();
        this.requestMaps();
    }

    bindSocketEvents() {
        this.game.socket.on('game:maps', ({ count }) => {
            if (this.callbacks.MapCountUpdated) {
                this.callbacks.MapCountUpdated(count);
            }
        })

        this.game.socket.on('game:map', ({ id, map }) => {
            this.map.deserealize(map);
            this.redrawMap();
        })
    }

    requestMaps() {
        this.game.socket.emit('game:maps');
    }

    requestMap(id: number) {
        this.game.socket.emit('game:map-request', { id });
    }

    whenMapsCountUpdated(callback: MapCountUpdatedCallback) {
        this.callbacks.MapCountUpdated = callback;
    }

    getGame(): Game {
        return this.game;
    }

    getMap(): HexMap {
        return this.map;
    }

    getTool(): SandboxTool {
        return this.tool;
    }

    setTool(tool: number) {
        this.tool = tool;
    }

    createMap(): HexMap {
        return (new HexMap()).deserealize(defaultMap);
    }

    redrawMap() {
        if (this.callbacks.MapUpdated) {
            this.callbacks.MapUpdated(this.map.getCells());
        }
    }

    whenMapUpdated(callback: MapUpdatedCallback) {
        this.callbacks.MapUpdated = callback;
    }

    onCellClick(id: number) {
        const cell = this.map.getCell(id);

        if (this.tool === SandboxTool.EmptyNone) {
            if (cell.isOccupied()) cell.setEmpty();
            if (cell.isEmpty() || cell.isNone()) cell.toggleNoneEmpty();
        }

        if (this.tool === SandboxTool.Player1 && !cell.isNone()) {
            if (cell.isOccupiedBy(PlayerTag.Player1)) {
                cell.setEmpty();
            } else {
                cell.setOccupiedBy(PlayerTag.Player1);
            }
        }

        if (this.tool === SandboxTool.Player2 && !cell.isNone()) {
            if (cell.isOccupiedBy(PlayerTag.Player2)) {
                cell.setEmpty();
            } else {
                cell.setOccupiedBy(PlayerTag.Player2);
            }
        }

        this.redrawMap();
    }

    getPlayerColors(): PlayerColorsList {
        return {
            1: 'own',
            2: 'enemy',
        }
    }

}