"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotClient = void 0;
const hexmap_1 = require("../shared/hexmap");
const types_1 = require("../shared/types");
const client_1 = require("./client");
const utils_1 = require("../game/utils");
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
    'hexonaut',
    'hexhomie',
    'hexist',
    'hexoid',
    'hexdroid',
    'hexgosu',
    'hexguru',
    'hexpal',
    'hexbuddy',
    'hexmachine',
    'hexminator',
    'hexbot',
    'hexlord',
];
class BotClient extends client_1.Client {
    constructor(profile) {
        super(null, profile);
        this.botId = '';
        this.botNickname = '';
        this.callbacks = {};
        this.botNickname = profile.nickname;
    }
    static getRandomName() {
        return botNames[Math.floor(Math.random() * botNames.length)];
    }
    isBot() {
        return true;
    }
    isConnected() {
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
        const chanceToHelloEmoji = 0.33;
        const chanceToNoMovesEmoji = 0.40;
        if (eventName === 'game:match:move-request') {
            this.respondWithMove();
        }
        if (eventName === 'game:match:start') {
            if (Math.random() <= chanceToHelloEmoji) {
                this.sendEmoji('👋', 1000 + Math.random() * 1000);
            }
        }
        if (eventName === 'game:match:no-moves') {
            if (Math.random() <= chanceToNoMovesEmoji) {
                const { loserTag, reasonType } = data;
                if (reasonType !== types_1.PlayerHasNoMovesReasons.Left) {
                    if (loserTag === this.getTag()) {
                        this.sendEmoji(this.shuffleArray(['👍', '☹️', '😡', '😭'])[0], 400);
                    }
                    else {
                        this.sendEmoji(this.shuffleArray(['😎', '😀', '😛'])[0], 400);
                    }
                }
            }
        }
    }
    sendEmoji(emoji, delay = 0) {
        if (delay) {
            setTimeout(() => this.callback('game:match:emoji', { emoji }), delay);
        }
        else {
            this.callback('game:match:emoji', { emoji });
        }
    }
    respondWithMove() {
        const moves = this.getPossibleMoves();
        const chanceToCaptureJump = this.match.getTurn() < 10 ? 0.02 : 0.08;
        const chanceToEmojiOnBigCapture = 0.35;
        const chanceToEmojiOnCapture = 0.1;
        if (moves.maxCapture && (moves.maxCaptureProfit > 1 || Math.random() <= chanceToCaptureJump)) {
            if (moves.maxCaptureProfit >= 5) {
                if (Math.random() <= chanceToEmojiOnBigCapture)
                    this.sendEmoji('😎', 1500);
            }
            else if (moves.maxCaptureProfit >= 4) {
                if (Math.random() <= chanceToEmojiOnCapture)
                    this.sendEmoji('😀', 1500);
            }
            return this.makeMove(moves.maxCapture);
        }
        if (moves.near.length > 0)
            return this.makeMove(this.getRandomArrayItem(moves.near));
        if (moves.maxCapture)
            return this.makeMove(moves.maxCapture);
        if (moves.minLose)
            return this.makeMove(moves.minLose);
        if (moves.far.length > 0)
            return this.makeMove(this.getRandomArrayItem(moves.far));
        return this.makeMove(this.getRandomArrayItem(moves.all));
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
                    const hostiles = map.getCellHostileNeighbors(emptyCellId, this.getTag());
                    const isJump = level === hexmap_1.HexNeighborLevel.Far;
                    let hostileToCapture = 0;
                    hostiles.forEach(hostileId => {
                        const hostileProfit = map.isCellCanBeAttacked(hostileId, this.getOpponent().getTag(), hostiles) ? 1 : 2;
                        hostileToCapture += hostileProfit;
                    });
                    const move = {
                        fromCell: cell,
                        toCell: emptyCell,
                        hostileToCapture,
                        ownToLoseInCounter: isJump ? ownToLoseInCounter : 0,
                        isJump,
                    };
                    moves.all.push(move);
                    move.isJump ? moves.far.push(move) : moves.near.push(move);
                    const loseCounter = move.isJump ? ownToLoseInCounter : 0;
                    if (hostileToCapture - move.ownToLoseInCounter > 0) {
                        const captureProfit = (hostileToCapture - move.ownToLoseInCounter) + (move.isJump && Math.random() > 0.1 ? 0 : 1);
                        if (captureProfit > 0 && captureProfit > maxCaptureProfit) {
                            maxCaptureProfit = captureProfit;
                            moves.maxCapture = move;
                        }
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
    getRandomArrayItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}
exports.BotClient = BotClient;
//# sourceMappingURL=botclient.js.map