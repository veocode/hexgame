import { HexMapCell } from "../shared/hexmapcell";
import { HexMap } from '../shared/hexmap';
import { PlayerColorsList, PlayerTag } from '../shared/player';
import { getLocaleTexts } from "./locales";
import { Game } from "./game";

const texts = getLocaleTexts();

export enum SandboxTool {
    EmptyNone = 9,
    Player1,
    Player2
}

type MapUpdatedCallback = (cells: HexMapCell[]) => void

export class Sandbox {

    private map: HexMap;

    private tool: SandboxTool = SandboxTool.EmptyNone;

    private callbacks: {
        MapUpdated?: MapUpdatedCallback | null,
    } = {};

    constructor(
        private game: Game,
    ) {
        this.map = this.createMap();
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