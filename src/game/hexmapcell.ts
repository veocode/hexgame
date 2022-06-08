import { PlayerTag } from "../types/utils";

export enum HexCellState {
    None = 0,
    Empty,
    Occupied
}

export enum HexCellHightlightType {
    None = 0,
    Center,
    Near,
    Far
}

export class HexMapCell {

    private state: HexCellState = HexCellState.None;
    private highlightType: HexCellHightlightType = HexCellHightlightType.None;
    private occupiedBy: PlayerTag | null = null;

    isNone(): boolean {
        return this.state === HexCellState.None;
    }

    setNone() {
        this.state = HexCellState.Empty;
        this.occupiedBy = null;
    }

    toggleNoneEmpty() {
        this.isEmpty() ? this.setNone() : this.setEmpty();
    }

    isEmpty(): boolean {
        return this.state === HexCellState.Empty;
    }

    setEmpty() {
        this.state = HexCellState.Empty;
        this.occupiedBy = null;
    }

    isOccupied(): boolean {
        return this.state === HexCellState.Occupied;
    }

    setOccupiedBy(player: PlayerTag) {
        this.state = HexCellState.Occupied;
        this.occupiedBy = player;
    }

    getOccupiedBy(): PlayerTag | null {
        return this.occupiedBy;
    }

    highlightAsNear() {
        this.highlightType = HexCellHightlightType.Near;
    }

    highlightAsFar() {
        this.highlightType = HexCellHightlightType.Far;
    }

    highlightOff() {
        this.highlightType = HexCellHightlightType.None;
    }

    getHighlightType(): HexCellHightlightType {
        return this.highlightType;
    }

    setHighlightType(type: HexCellHightlightType) {
        this.highlightType = type;
    }

    isHighlighted(): boolean {
        return this.highlightType !== HexCellHightlightType.None;
    }

}