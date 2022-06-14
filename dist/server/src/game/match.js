"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameMatch = void 0;
const hexmap_1 = require("../shared/hexmap");
const player_1 = require("../shared/player");
const MaxPlayers = 2;
const Delay = {
    noMovesFillPerCell: 120,
    betweenMoves: 800
};
class GameMatch {
    constructor(serializedMap) {
        this.players = {};
        this.currentPlayerTag = player_1.PlayerTag.Player1;
        this.callbacks = {};
        this.map = new hexmap_1.HexMap();
        this.map.deserealize(serializedMap);
    }
    addPlayer(player) {
        const count = this.getPlayersCount();
        if (count === MaxPlayers)
            return;
        const tag = { 0: player_1.PlayerTag.Player1, 1: player_1.PlayerTag.Player2 }[count];
        player.setTag(tag);
        this.bindPlayerEvents(player);
        this.players[tag] = player;
    }
    removePlayer(player) {
        const tag = player.getTag();
        if ((tag in this.players) && (this.players[tag].id === player.id)) {
            this.players[tag] = null;
            if (tag === this.currentPlayerTag) {
                this.finishWithNoMoves(player_1.PlayerHasNoMovesReasons.Left);
            }
        }
        ;
    }
    bindPlayerEvents(player) {
        player.on('game:match:move-response', ({ fromId, toId }) => {
            var _a;
            if (this.currentPlayerTag !== player.getTag())
                return;
            if (this.validateAndMakeMove(player, fromId, toId)) {
                (_a = player.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:move-by-opponent', { fromId, toId });
                setTimeout(() => {
                    const scores = this.sendScoreToPlayers();
                    if (!this.mapHasEmptyCells())
                        return this.finish();
                    this.switchPlayer();
                    if (scores[this.currentPlayerTag].score === 0)
                        return this.finishWithNoMoves(player_1.PlayerHasNoMovesReasons.Eliminated);
                    if (!this.players[this.currentPlayerTag])
                        return this.finishWithNoMoves(player_1.PlayerHasNoMovesReasons.Left);
                    if (!this.playerHasMoves(this.currentPlayerTag))
                        return this.finishWithNoMoves(player_1.PlayerHasNoMovesReasons.NoMoves);
                    this.requestNextMove();
                }, Delay.betweenMoves);
            }
        });
        player.on('game:match:move-cell-selected', ({ id }) => {
            var _a;
            if (this.currentPlayerTag !== player.getTag())
                return;
            (_a = player.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:move-cell-selected', { id });
        });
    }
    unbindPlayerEvents(player) {
        player.off('game:match:move-response');
        player.off('game:match:move-cell-selected');
    }
    sendScoreToPlayers() {
        const scores = this.getPlayerScores();
        this.forEachPlayer(player => player === null || player === void 0 ? void 0 : player.send('game:match:scores', { scores }));
        return scores;
    }
    getPlayersCount() {
        return Object.keys(this.players).length;
    }
    forEachPlayer(callback) {
        Object.values(this.players).forEach(callback);
    }
    start() {
        this.currentPlayerTag = this.getRandomPlayerTag();
        this.forEachPlayer((player) => {
            player.send('game:match:start', {
                playerTag: player.getTag(),
                map: this.map.serialize(),
                scores: this.getPlayerScores()
            });
        });
        setTimeout(() => this.requestNextMove(), Delay.betweenMoves);
    }
    finish() {
        const scores = this.getPlayerScores();
        const scorePlayer1 = scores[player_1.PlayerTag.Player1].score;
        const scorePlayer2 = scores[player_1.PlayerTag.Player2].score;
        const isWithdraw = scorePlayer1 === scorePlayer2;
        let winnerTag = 0;
        if (!isWithdraw) {
            winnerTag = scorePlayer1 > scorePlayer2
                ? player_1.PlayerTag.Player1
                : player_1.PlayerTag.Player2;
        }
        this.forEachPlayer(player => {
            if (!player)
                return;
            this.unbindPlayerEvents(player);
            player.setIdle();
            player.setOpponent(null);
            const matchResult = {
                isWinner: !isWithdraw && winnerTag === player.getTag(),
                isWithdraw,
                scores
            };
            player.send('game:match:over', matchResult);
        });
        this.currentPlayerTag = 0;
        if (this.callbacks.Over)
            this.callbacks.Over();
    }
    finishWithNoMoves(reasonType) {
        const loserTag = this.currentPlayerTag;
        const winnerTag = loserTag === player_1.PlayerTag.Player2
            ? player_1.PlayerTag.Player1
            : player_1.PlayerTag.Player2;
        this.forEachPlayer((player) => {
            if (!player)
                return;
            player.send('game:match:no-moves', {
                loserTag,
                reasonType
            });
        });
        let emptyCellsCount = 0;
        this.map.getCells().forEach(cell => {
            if (cell.isEmpty()) {
                emptyCellsCount++;
                cell.setOccupiedBy(winnerTag);
            }
        });
        setTimeout(() => this.finish(), emptyCellsCount * Delay.noMovesFillPerCell);
    }
    requestNextMove() {
        this.currentPlayer().send('game:match:move-request');
        this.currentPlayer().getOpponent().send('game:match:move-pending');
        // todo: start move/turn timer
    }
    validateAndMakeMove(player, fromId, toId) {
        const srcCell = this.map.getCell(fromId);
        const dstCell = this.map.getCell(toId);
        if (!srcCell.isOccupied())
            return false;
        if (!dstCell.isEmpty())
            return false;
        const level = this.map.getCellNeighborLevel(srcCell.id, dstCell.id);
        if (!level)
            return false;
        if (srcCell.getOccupiedBy() !== player.getTag())
            return false;
        if (level === hexmap_1.HexNeighborLevel.Near) {
            this.map.occupyCell(dstCell.id, player.getTag());
        }
        if (level === hexmap_1.HexNeighborLevel.Far) {
            this.map.emptyCell(srcCell.id);
            this.map.occupyCell(dstCell.id, player.getTag());
        }
        const hostileIds = this.map.getCellHostileNeighbors(dstCell.id);
        if (hostileIds.length > 0) {
            hostileIds.forEach(hostileId => {
                this.map.occupyCell(hostileId, player.getTag());
            });
        }
        return true;
    }
    mapHasEmptyCells() {
        let hasEmpty = false;
        this.map.getCells().forEach(cell => {
            if (hasEmpty)
                return;
            hasEmpty = cell.isEmpty();
        });
        return hasEmpty;
    }
    getEmptyCellsCount() {
        let count = 0;
        this.map.getCells().forEach(cell => cell.isEmpty() && count++);
        return count;
    }
    playerHasMoves(player) {
        let hasMoves = false;
        this.map.getCells().forEach(cell => {
            if (hasMoves)
                return;
            if (!cell.isOccupiedBy(player))
                return;
            const emptyNeighbors = this.map.getCellEmptyNeighbors(cell.id);
            const hasNear = emptyNeighbors[hexmap_1.HexNeighborLevel.Near].length > 0;
            const hasFar = emptyNeighbors[hexmap_1.HexNeighborLevel.Far].length > 0;
            hasMoves = hasNear || hasFar;
        });
        return hasMoves;
    }
    takeEmptyCellsByPlayer(player) {
        this.map.getCells().forEach(cell => {
            if (cell.isEmpty())
                cell.setOccupiedBy(player);
        });
    }
    getPlayerScores() {
        const scores = {};
        const tags = [player_1.PlayerTag.Player1, player_1.PlayerTag.Player2];
        tags.forEach((tag) => {
            var _a;
            scores[tag] = {
                nickname: ((_a = this.players[tag]) === null || _a === void 0 ? void 0 : _a.nickname) || '-',
                score: 0
            };
        });
        this.map.getCells().forEach(cell => {
            if (!cell.isOccupied())
                return;
            scores[cell.getOccupiedBy()].score += 1;
        });
        return scores;
    }
    getRandomPlayerTag() {
        return [player_1.PlayerTag.Player1, player_1.PlayerTag.Player2][Math.floor(Math.random() * 2)];
    }
    switchPlayer() {
        this.currentPlayerTag = this.currentPlayerTag === player_1.PlayerTag.Player1
            ? player_1.PlayerTag.Player2
            : player_1.PlayerTag.Player1;
    }
    currentPlayer() {
        return this.players[this.currentPlayerTag];
    }
    whenOver(callback) {
        this.callbacks.Over = callback;
    }
}
exports.GameMatch = GameMatch;
//# sourceMappingURL=match.js.map