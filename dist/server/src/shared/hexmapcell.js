"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HexMapCell = exports.HexCellHightlightType = exports.HexCellState = void 0;
var HexCellState;
(function (HexCellState) {
    HexCellState[HexCellState["None"] = 0] = "None";
    HexCellState[HexCellState["Empty"] = 1] = "Empty";
    HexCellState[HexCellState["Occupied"] = 2] = "Occupied";
    HexCellState[HexCellState["Freed"] = 3] = "Freed";
})(HexCellState = exports.HexCellState || (exports.HexCellState = {}));
var HexCellHightlightType;
(function (HexCellHightlightType) {
    HexCellHightlightType[HexCellHightlightType["None"] = 0] = "None";
    HexCellHightlightType[HexCellHightlightType["Center"] = 1] = "Center";
    HexCellHightlightType[HexCellHightlightType["Near"] = 2] = "Near";
    HexCellHightlightType[HexCellHightlightType["Far"] = 3] = "Far";
})(HexCellHightlightType = exports.HexCellHightlightType || (exports.HexCellHightlightType = {}));
class HexMapCell {
    constructor(id) {
        this.id = id;
        this.state = HexCellState.None;
        this.highlightType = HexCellHightlightType.None;
        this.occupiedBy = null;
    }
    isNone() {
        return this.state === HexCellState.None;
    }
    setNone() {
        this.state = HexCellState.None;
        this.occupiedBy = null;
    }
    toggleNoneEmpty() {
        this.isEmpty() ? this.setNone() : this.setEmpty();
    }
    isEmpty() {
        return this.state === HexCellState.Empty;
    }
    setEmpty() {
        this.state = HexCellState.Empty;
        this.occupiedBy = null;
    }
    isOccupied() {
        return this.state === HexCellState.Occupied;
    }
    isOccupiedBy(player) {
        return this.isOccupied() && this.getOccupiedBy() === player;
    }
    setOccupiedBy(player) {
        this.state = HexCellState.Occupied;
        this.occupiedBy = player;
    }
    getOccupiedBy() {
        return this.occupiedBy;
    }
    isFreed() {
        return this.state === HexCellState.Freed;
    }
    setFreed() {
        this.state = HexCellState.Freed;
    }
    isHostileTo(otherPlayer) {
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
    getHighlightType() {
        return this.highlightType;
    }
    setHighlightType(type) {
        this.highlightType = type;
    }
    isHighlighted() {
        return this.highlightType !== HexCellHightlightType.None;
    }
}
exports.HexMapCell = HexMapCell;
//# sourceMappingURL=hexmapcell.js.map