export enum HexCellState {
    None = 0,
    Empty,
    Occupied
}

export enum HexCellHightlightType {
    None = 0,
    Near,
    Far
}

export class HexMapCell {

    private state: HexCellState = HexCellState.None;
    private highlightType: HexCellHightlightType = HexCellHightlightType.None;

    isNone(): boolean {
        return this.state === HexCellState.None;
    }

    setNone() {
        this.state = HexCellState.Empty;
    }

    toggleNoneEmpty() {
        this.isEmpty() ? this.setNone() : this.setEmpty();
    }

    isEmpty(): boolean {
        return this.state === HexCellState.Empty;
    }

    setEmpty() {
        this.state = HexCellState.Empty;
    }

    isOccupied(): boolean {
        return this.state === HexCellState.Occupied;
    }

    setOccupied() {
        this.state = HexCellState.Occupied;
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