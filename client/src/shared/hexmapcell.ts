import { PlayerTag } from "./player";

export enum HexCellState {
    None = 0,
    Empty,
    Occupied,
    Freed
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

    constructor(public readonly id: number) { }

    isNone(): boolean {
        return this.state === HexCellState.None;
    }

    setNone() {
        this.state = HexCellState.None;
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

    isOccupiedBy(player: PlayerTag): boolean {
        return this.isOccupied() && this.getOccupiedBy() === player;
    }

    setOccupiedBy(player: PlayerTag) {
        this.state = HexCellState.Occupied;
        this.occupiedBy = player;
    }

    getOccupiedBy(): PlayerTag | null {
        return this.occupiedBy;
    }

    isFreed(): boolean {
        return this.state === HexCellState.Freed;
    }

    setFreed() {
        this.state = HexCellState.Freed;
    }

    isHostileTo(otherPlayer: PlayerTag | null): boolean {
        return this.isOccupied() && this.getOccupiedBy() !== otherPlayer;
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