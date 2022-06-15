"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotClient = void 0;
const hexmap_1 = require("../shared/hexmap");
const client_1 = require("./client");
const botNames = [
    'h3xk1ll3r',
    'hexmaniac',
    'hellohex',
    'hexcake',
    'xehhex',
    'whatahex',
];
class BotClient extends client_1.Client {
    constructor() {
        super(...arguments);
        this.botId = '';
        this.botNickname = '';
        this.callbacks = {};
    }
    getId() {
        if (this.botId)
            return this.botId;
        return this.botId = this.generateId();
    }
    getNickname() {
        if (this.botNickname)
            return this.botNickname;
        return this.botNickname = this.shuffleArray(botNames)[0];
    }
    generateId(length = 6) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    on(eventName, callback) {
        this.callbacks[eventName] = callback;
    }
    off(eventName) {
        delete this.callbacks[eventName];
    }
    send(eventName, data) {
        if (eventName === 'game:match:move-request') {
            this.onMatchMoveRequest();
        }
    }
    onMatchMoveRequest() {
        const moves = this.getPossibleMoves();
        if (moves.maxCaptureProfit) {
            console.log('moves.maxCaptureProfit', moves.maxCaptureProfit, 'to', moves.maxCapture.toCell.id);
        }
        else {
            console.log('moves.maxCaptureProfit', 'none');
        }
        if (moves.maxCapture && moves.maxCaptureProfit > 1)
            return this.makeMove(moves.maxCapture);
        if (moves.near.length > 0)
            return this.makeMove(this.shuffleArray(moves.near)[0]);
        if (moves.maxCapture && moves.maxCaptureProfit > 0)
            return this.makeMove(moves.maxCapture);
        if (moves.maxCapture)
            return this.makeMove(moves.maxCapture);
        if (moves.minLose)
            return this.makeMove(moves.minLose);
        if (moves.far.length > 0)
            return this.makeMove(this.shuffleArray(moves.far)[0]);
        return this.makeMove(this.shuffleArray(moves.all)[0]);
    }
    callback(eventName, data) {
        if (eventName in this.callbacks) {
            this.callbacks[eventName](data);
        }
    }
    makeMove(move) {
        setTimeout(() => {
            this.callback('game:match:move-cell-selected', {
                id: move.fromCell.id,
            });
            setTimeout(() => {
                this.callback('game:match:move-response', {
                    fromId: move.fromCell.id,
                    toId: move.toCell.id
                });
            }, 1000);
        }, 300);
    }
    getPossibleMoves() {
        const moves = {
            all: [],
            far: [],
            near: [],
            maxCapture: null,
            maxCaptureProfit: 0,
            minLose: null,
            minLoseCount: 0
        };
        const levels = [
            hexmap_1.HexNeighborLevel.Near,
            hexmap_1.HexNeighborLevel.Far
        ];
        let maxCaptureProfit = 0;
        let minLose = 99999;
        const map = this.match.getMap();
        map.getCells().forEach(cell => {
            if (!cell.isOccupiedBy(this.getTag()))
                return;
            const emptyNeighbors = map.getCellEmptyNeighbors(cell.id);
            const hasNear = emptyNeighbors[hexmap_1.HexNeighborLevel.Near].length > 0;
            const hasFar = emptyNeighbors[hexmap_1.HexNeighborLevel.Far].length > 0;
            const hasMoves = hasNear || hasFar;
            if (hasMoves) {
                const ownToLoseInCounter = map.isCellCanBeAttacked(cell.id, this.getOpponent().getTag())
                    ? map.getCellAllyNeighbors(cell.id, this.getTag()).length
                    : 0;
                levels.forEach(level => {
                    emptyNeighbors[level].forEach(emptyCellId => {
                        const emptyCell = map.getCell(emptyCellId);
                        const hostileToCapture = map.getCellHostileNeighbors(emptyCellId, this.getTag()).length;
                        const move = {
                            fromCell: cell,
                            toCell: emptyCell,
                            hostileToCapture,
                            ownToLoseInCounter,
                            isJump: level === hexmap_1.HexNeighborLevel.Far,
                        };
                        moves.all.push(move);
                        move.isJump ? moves.far.push(move) : moves.near.push(move);
                        const captureProfit = (hostileToCapture - ownToLoseInCounter) + (move.isJump ? 0 : 1);
                        if (captureProfit) {
                            console.log(`Cell ${emptyCellId} - captureProfit: ${captureProfit}`, map.getCellHostileNeighbors(emptyCellId, this.getTag()));
                        }
                        if (captureProfit > 0 && captureProfit > maxCaptureProfit) {
                            maxCaptureProfit = captureProfit;
                            moves.maxCapture = move;
                        }
                        if (ownToLoseInCounter > 0 && ownToLoseInCounter < minLose) {
                            minLose = ownToLoseInCounter;
                            moves.minLose = move;
                        }
                    });
                });
            }
        });
        moves.maxCaptureProfit = maxCaptureProfit;
        moves.minLoseCount = minLose;
        return moves;
    }
    shuffleArray(sourceArray) {
        const array = [...sourceArray];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
exports.BotClient = BotClient;
//# sourceMappingURL=botclient.js.map