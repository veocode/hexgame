"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HexMap = exports.HexNeighborLevel = void 0;
const player_1 = require("./player");
const hexmapcell_1 = require("./hexmapcell");
var HexNeighborLevel;
(function (HexNeighborLevel) {
    HexNeighborLevel[HexNeighborLevel["Near"] = 1] = "Near";
    HexNeighborLevel[HexNeighborLevel["Far"] = 2] = "Far";
})(HexNeighborLevel = exports.HexNeighborLevel || (exports.HexNeighborLevel = {}));
class HexMap {
    constructor(cellInitCallback = null) {
        this.width = 9;
        this.height = 9;
        this.cells = [];
        this.neighborsCache = {};
        let id = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = new hexmapcell_1.HexMapCell(id++);
                if (cellInitCallback)
                    cellInitCallback(cell);
                this.cells.push(cell);
            }
        }
        this.initNeighborsCache();
    }
    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    initNeighborsCache() {
        this.cells.forEach(cell => {
            this.neighborsCache[cell.id] = this.getCellNeighbors(cell.id);
        });
    }
    getCell(id) {
        return this.cells[id];
    }
    getCells() {
        return [...this.cells];
    }
    isCellExists(id) {
        return !this.cells[id].isNone();
    }
    isCellEmpty(id) {
        return this.cells[id].isEmpty();
    }
    isCellOccupied(id) {
        return this.cells[id].isOccupied();
    }
    isCellOccupiedBy(id, player) {
        return this.cells[id].isOccupiedBy(player);
    }
    getCellCoordinatesById(id) {
        return {
            x: (id % this.width) | 0,
            y: (id / this.width) | 0
        };
    }
    getCellIdByCoordinates(x, y) {
        return x + this.width * y;
    }
    getCellNeighborLevel(id, neighborId) {
        const allNeighborsList = this.getCellNeighbors(id);
        if (allNeighborsList[HexNeighborLevel.Near].includes(neighborId))
            return HexNeighborLevel.Near;
        if (allNeighborsList[HexNeighborLevel.Far].includes(neighborId))
            return HexNeighborLevel.Far;
        return null;
    }
    getCellHostileNeighbors(id) {
        const cell = this.cells[id];
        if (!cell.isOccupied)
            return [];
        const occupiedBy = cell.getOccupiedBy();
        const nearestNeighborIds = this.getCellNearestNeighborIds(id);
        const hostileIds = [];
        nearestNeighborIds.forEach(nearId => {
            if (this.cells[nearId].isHostileTo(occupiedBy)) {
                hostileIds.push(nearId);
            }
        });
        return hostileIds;
    }
    getCellAllyNeighbors(id) {
        const cell = this.cells[id];
        if (!cell.isOccupied)
            return [];
        const occupiedBy = cell.getOccupiedBy();
        const nearestNeighborIds = this.getCellNearestNeighborIds(id);
        const allyIds = [];
        nearestNeighborIds.forEach(nearId => {
            if (this.cells[nearId].isOccupiedBy(occupiedBy)) {
                allyIds.push(nearId);
            }
        });
        return allyIds;
    }
    getCellEmptyNeighbors(id) {
        const emptyNeighborsList = {};
        emptyNeighborsList[HexNeighborLevel.Near] = [];
        emptyNeighborsList[HexNeighborLevel.Far] = [];
        const allNeighborsList = this.getCellNeighbors(id);
        allNeighborsList[HexNeighborLevel.Near].forEach(nearId => {
            if (this.isCellEmpty(nearId)) {
                emptyNeighborsList[HexNeighborLevel.Near].push(nearId);
            }
        });
        allNeighborsList[HexNeighborLevel.Far].forEach(farId => {
            if (id === farId)
                return;
            if (this.isCellEmpty(farId)) {
                emptyNeighborsList[HexNeighborLevel.Far].push(farId);
            }
        });
        return emptyNeighborsList;
    }
    getCellNeighbors(id) {
        if (id in this.neighborsCache) {
            return this.neighborsCache[id];
        }
        const neighborList = {};
        neighborList[HexNeighborLevel.Near] = [];
        neighborList[HexNeighborLevel.Far] = [];
        const visitedIds = [id];
        const nearestNeighborIds = this.getCellNearestNeighborIds(id);
        nearestNeighborIds.forEach(nearId => {
            neighborList[HexNeighborLevel.Near].push(nearId);
            visitedIds.push(nearId);
        });
        nearestNeighborIds.forEach(nearId => {
            const farNeighborIds = this.getCellNearestNeighborIds(nearId);
            farNeighborIds.forEach(farId => {
                if (id === farId)
                    return;
                if (visitedIds.includes(farId))
                    return;
                neighborList[HexNeighborLevel.Far].push(farId);
                visitedIds.push(farId);
            });
        });
        return neighborList;
    }
    getCellNearestNeighborIds(id) {
        if (id in this.neighborsCache) {
            return this.neighborsCache[id][HexNeighborLevel.Near];
        }
        const neighborIds = [];
        const neighborPositions = [];
        const pos = this.getCellCoordinatesById(id);
        if (pos.y % 2 !== 0) {
            if (pos.y > 0)
                neighborPositions.push({ x: pos.x, y: pos.y - 1 });
            if (pos.x > 0)
                neighborPositions.push({ x: pos.x - 1, y: pos.y });
            if (pos.y < this.height - 1)
                neighborPositions.push({ x: pos.x, y: pos.y + 1 });
            if (pos.y > 0 && pos.x < this.width - 1)
                neighborPositions.push({ x: pos.x + 1, y: pos.y - 1 });
            if (pos.x < this.width - 1)
                neighborPositions.push({ x: pos.x + 1, y: pos.y });
            if (pos.y < this.height - 1 && pos.x < this.width - 1)
                neighborPositions.push({ x: pos.x + 1, y: pos.y + 1 });
        }
        else {
            if (pos.x > 0 && pos.y > 0)
                neighborPositions.push({ x: pos.x - 1, y: pos.y - 1 });
            if (pos.x > 0)
                neighborPositions.push({ x: pos.x - 1, y: pos.y });
            if (pos.x > 0 && pos.y < this.height - 1)
                neighborPositions.push({ x: pos.x - 1, y: pos.y + 1 });
            if (pos.y > 0)
                neighborPositions.push({ x: pos.x, y: pos.y - 1 });
            if (pos.x < this.width - 1)
                neighborPositions.push({ x: pos.x + 1, y: pos.y });
            if (pos.y < this.height - 1)
                neighborPositions.push({ x: pos.x, y: pos.y + 1 });
        }
        neighborPositions.forEach(neighborPosition => {
            const neighborId = this.getCellIdByCoordinates(neighborPosition.x, neighborPosition.y);
            neighborIds.push(neighborId);
        });
        return neighborIds;
    }
    resetHighlight() {
        this.cells.forEach(cell => {
            if (cell.isHighlighted())
                cell.highlightOff();
        });
    }
    highlightCell(id, type) {
        this.cells[id].setHighlightType(type);
    }
    highlightCellNeighbors(id) {
        const neighborList = this.getCellEmptyNeighbors(id);
        neighborList[HexNeighborLevel.Near].forEach(cellId => this.highlightCell(cellId, hexmapcell_1.HexCellHightlightType.Near));
        neighborList[HexNeighborLevel.Far].forEach(cellId => this.highlightCell(cellId, hexmapcell_1.HexCellHightlightType.Far));
        this.highlightCell(id, hexmapcell_1.HexCellHightlightType.Center);
    }
    occupyCell(id, player) {
        const cell = this.cells[id];
        cell.setOccupiedBy(player);
        return true;
    }
    freeCell(id) {
        const cell = this.cells[id];
        cell.setFreed();
        return true;
    }
    emptyCell(id) {
        const cell = this.cells[id];
        cell.setEmpty();
        return true;
    }
    serialize() {
        const serializedMap = [];
        this.cells.forEach(cell => {
            let cellValue = 0;
            if (cell.isEmpty())
                cellValue = 1;
            if (cell.isOccupiedBy(player_1.PlayerTag.Player1))
                cellValue = 2;
            if (cell.isOccupiedBy(player_1.PlayerTag.Player2))
                cellValue = 3;
            serializedMap.push(cellValue);
        });
        return serializedMap;
    }
    deserealize(serializedMap) {
        serializedMap.forEach((cellValue, id) => {
            const cell = this.getCell(id);
            if (cellValue === 0)
                cell.setNone();
            if (cellValue === 1)
                cell.setEmpty();
            if (cellValue === 2)
                cell.setOccupiedBy(player_1.PlayerTag.Player1);
            if (cellValue === 3)
                cell.setOccupiedBy(player_1.PlayerTag.Player2);
        });
    }
}
exports.HexMap = HexMap;
//# sourceMappingURL=hexmap.js.map