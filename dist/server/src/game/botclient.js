"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotClient = void 0;
const hexmap_1 = require("../shared/hexmap");
const player_1 = require("../shared/player");
const client_1 = require("./client");
const utils_1 = require("./utils");
const botNames = [
    'hexmaniac',
    'hexoholic',
    'hexxer',
    'hexfan',
    'hexbro',
    'hexman',
    'hexdude',
    'hexmaster',
    'hexrookie',
    'hexsports',
    'hexallday',
    'hexonomical',
    'hexomorfin',
    'hexotoxin',
    'hexonaut',
    'hexlady',
    'hexchick',
    'hexhomie',
    'hexist',
    'hexoid',
    'hexxeh',
    'hexatoxx',
];
class BotClient extends client_1.Client {
    constructor() {
        super(...arguments);
        this.botId = '';
        this.botNickname = '';
        this.callbacks = {};
    }
    isBot() {
        return true;
    }
    getId() {
        if (this.botId)
            return this.botId;
        return this.botId = (0, utils_1.generateId)();
    }
    getNickname() {
        if (this.botNickname)
            return this.botNickname;
        return this.botNickname = this.shuffleArray(botNames)[0];
    }
    callback(eventName, data) {
        if (eventName in this.callbacks) {
            this.callbacks[eventName](data);
        }
    }
    on(eventName, callback) {
        this.callbacks[eventName] = callback;
    }
    off(eventName) {
        // delete this.callbacks[eventName];
    }
    send(eventName, data) {
        if (eventName === 'game:match:move-request') {
            this.respondWithMove();
        }
        if (eventName === 'game:match:start') {
            this.sendEmoji('👋', 1000 + Math.random() * 500);
        }
        if (eventName === 'game:match:no-moves') {
            const { loserTag, reasonType } = data;
            if (reasonType !== player_1.PlayerHasNoMovesReasons.Left) {
                if (loserTag === this.getTag()) {
                    this.sendEmoji(this.shuffleArray(['👍', '☹️', '😡', '😭'])[0], 400);
                }
                else {
                    this.sendEmoji(this.shuffleArray(['😎', '😀', '😛'])[0], 400);
                }
            }
        }
    }
    sendEmoji(emoji, delay = 0) {
        var _a;
        if (delay) {
            setTimeout(() => { var _a; return (_a = this.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:emoji', { emoji }); }, delay);
        }
        else {
            (_a = this.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:emoji', { emoji });
        }
    }
    respondWithMove() {
        const moves = this.getPossibleMoves();
        if (moves.maxCapture) {
            if (moves.maxCaptureProfit >= 4) {
                this.sendEmoji('😎', 1200);
            }
            else if (moves.maxCaptureProfit >= 3) {
                if (Math.random() >= .85)
                    this.sendEmoji('😀', 1200);
            }
            return this.makeMove(moves.maxCapture);
        }
        if (moves.near.length > 0)
            return this.makeMove(this.shuffleArray(moves.near)[0]);
        if (moves.minLose)
            return this.makeMove(moves.minLose);
        if (moves.far.length > 0)
            return this.makeMove(this.shuffleArray(moves.far)[0]);
        return this.makeMove(this.shuffleArray(moves.all)[0]);
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
            if (!hasMoves) {
                return;
            }
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
                    const loseCounter = move.isJump ? ownToLoseInCounter : 0;
                    const captureProfit = (hostileToCapture - loseCounter) + (move.isJump ? 0 : 1);
                    if (captureProfit > 0 && captureProfit > maxCaptureProfit) {
                        maxCaptureProfit = captureProfit;
                        moves.maxCapture = move;
                    }
                    if (loseCounter > 0 && loseCounter < minLose) {
                        minLose = loseCounter;
                        moves.minLose = move;
                    }
                });
            });
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