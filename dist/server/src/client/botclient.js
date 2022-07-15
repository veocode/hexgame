"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotClient = exports.BotDifficulty = void 0;
const hexmap_1 = require("../shared/hexmap");
const types_1 = require("../shared/types");
const client_1 = require("./client");
const utils_1 = require("../game/utils");
const botNames = {
    easy: [
        'hexrookie',
        'hexnoob',
        'hexlamer',
        'hexstart',
        'hexeasy',
    ],
    normal: [
        'hexoholic',
        'hexfan',
        'hexbro',
        'hexman',
        'hexdude',
        'hexonaut',
        'hexhomie',
        'hexpal',
        'hexbuddy',
        'hexxer',
    ],
    hard: [
        'hexmaniac',
        'hexgosu',
        'hexguru',
        'hexmachine',
        'hexminator',
        'hexlord',
        'hexmaster',
    ],
};
var BotDifficulty;
(function (BotDifficulty) {
    BotDifficulty[BotDifficulty["Easy"] = 0] = "Easy";
    BotDifficulty[BotDifficulty["Normal"] = 1] = "Normal";
    BotDifficulty[BotDifficulty["Hard"] = 2] = "Hard";
})(BotDifficulty = exports.BotDifficulty || (exports.BotDifficulty = {}));
class BotClient extends client_1.Client {
    constructor(profile, difficulty) {
        super(null, profile);
        this.botId = '';
        this.botNickname = '';
        this.callbacks = {};
        this.difficulty = difficulty;
        this.botNickname = profile.nickname;
    }
    static getRandomName(difficulty) {
        let names = botNames.normal;
        if (difficulty === BotDifficulty.Easy)
            names = botNames.easy;
        if (difficulty === BotDifficulty.Hard)
            names = botNames.hard;
        return names[Math.floor(Math.random() * names.length)];
    }
    getScoreMultiplier() {
        switch (this.difficulty) {
            case BotDifficulty.Easy:
                return 0.25;
            case BotDifficulty.Normal:
                return 1;
            case BotDifficulty.Hard:
                return 1.25;
        }
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
        return this.botNickname;
    }
    getNicknameWithIcon(isPrepend = true) {
        const icon = '🤖';
        return isPrepend ? `${icon} ${this.botNickname}` : `${this.botNickname} ${icon}`;
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
        switch (this.difficulty) {
            case BotDifficulty.Easy:
                return this.makeMove(this.getMoveEasy());
            case BotDifficulty.Normal:
                return this.makeMove(this.getMoveNormal());
            case BotDifficulty.Hard:
                return this.makeMove(this.getMoveHard());
        }
    }
    getMoveEasy() {
        const map = this.match.getMap();
        const moves = this.getPossibleMoves(map);
        if (Math.random() <= .35) {
            return this.getRandomArrayItem(moves.all);
        }
        if (Math.random() <= .55) {
            moves.all.sort((move1, move2) => move2.profit - move1.profit);
        }
        return this.getRandomArrayItem(moves.all.slice(0, 3));
    }
    getMoveNormal() {
        const map = this.match.getMap();
        const moves = this.getPossibleMoves(map);
        moves.all.sort((move1, move2) => move2.profit - move1.profit);
        return moves.all[0];
    }
    getMoveHard() {
        const map = this.match.getMap();
        const moves = this.getPossibleMoves(map);
        if (moves.all.length === 1)
            return moves.all[0];
        const opponentTag = this.getOpponentTag();
        let nextTurnMap = new hexmap_1.HexMap();
        moves.all.forEach(move => {
            nextTurnMap = this.getMapAfterMove(nextTurnMap.deserealize(map.serialize()), move);
            const opponentHasNow = nextTurnMap.getCellsOccupiedByPlayerCount(opponentTag);
            const opponentMoves = this.getPossibleMoves(nextTurnMap, opponentTag, this.getTag());
            if (opponentMoves.all.length > 0) {
                opponentMoves.all.sort((move1, move2) => move2.profit - move1.profit);
                nextTurnMap = this.getMapAfterMove(nextTurnMap, opponentMoves.all[0], opponentTag);
                const opponentWillHave = nextTurnMap.getCellsOccupiedByPlayerCount(opponentTag);
                const futureOpponentProfit = opponentWillHave - opponentHasNow;
                move.profit -= futureOpponentProfit;
            }
        });
        moves.all.sort((move1, move2) => {
            if (move1.profit === move2.profit) {
                return Math.random() < 0.5 ? 1 : -1;
            }
            return move2.profit - move1.profit;
        });
        return moves.all[0];
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
    getPossibleMoves(map, myTag, opponentTag) {
        myTag = myTag || this.getTag();
        opponentTag = opponentTag || this.getOpponent().getTag();
        const isEasy = this.difficulty === BotDifficulty.Easy;
        const moves = {
            all: [],
            far: [],
            near: [],
        };
        const levels = [
            hexmap_1.HexNeighborLevel.Near,
            hexmap_1.HexNeighborLevel.Far
        ];
        map.getCells().forEach(cell => {
            if (!cell.isOccupiedBy(myTag))
                return;
            const emptyNeighbors = map.getCellEmptyNeighbors(cell.id);
            const hasNear = emptyNeighbors[hexmap_1.HexNeighborLevel.Near].length > 0;
            const hasFar = emptyNeighbors[hexmap_1.HexNeighborLevel.Far].length > 0;
            const hasMoves = hasNear || hasFar;
            if (!hasMoves) {
                return;
            }
            let ownToLoseInCounter = 0;
            if (!isEasy) {
                ownToLoseInCounter = map.isCellCanBeAttacked(cell.id, opponentTag)
                    ? map.getCellAllyNeighbors(cell.id, myTag).length
                    : 0;
            }
            levels.forEach(level => {
                emptyNeighbors[level].forEach(emptyCellId => {
                    const emptyCell = map.getCell(emptyCellId);
                    const hostiles = map.getCellHostileNeighbors(emptyCellId, myTag);
                    const isJump = level === hexmap_1.HexNeighborLevel.Far;
                    let hostileToCapture = (isJump && !isEasy ? 0 : 1) + hostiles.length;
                    const move = {
                        id: `${cell.id}-${emptyCell.id}`,
                        fromCell: cell,
                        toCell: emptyCell,
                        profit: hostileToCapture - (isJump ? ownToLoseInCounter : 0),
                        isJump,
                    };
                    moves.all.push(move);
                    move.isJump ? moves.far.push(move) : moves.near.push(move);
                });
            });
        });
        return moves;
    }
    getMapAfterMove(map, move, myTag) {
        myTag = myTag || this.getTag();
        map.occupyCell(move.toCell.id, myTag);
        const hostileIds = map.getCellHostileNeighbors(move.toCell.id);
        if (hostileIds.length > 0) {
            hostileIds.forEach(hostileId => {
                map.occupyCell(hostileId, myTag);
            });
        }
        return map;
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