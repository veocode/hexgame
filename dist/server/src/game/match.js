"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameMatch = void 0;
const hexmap_1 = require("../shared/hexmap");
const player_1 = require("../shared/player");
const MaxPlayers = 2;
const MaxTurnTimeSeconds = 30;
const MaxMissedTurnsCount = 3;
const Delay = {
    noMovesFillPerCell: 200,
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
    getMap() {
        return this.map;
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
    hasBot() {
        let hasBot = false;
        this.forEachPlayer(player => { hasBot = hasBot || player.isBot(); });
        return hasBot;
    }
    getPlayer(tag) {
        return this.players[tag];
    }
    bindPlayerEvents(player) {
        player.on('game:match:move-response', ({ fromId, toId }) => this.onPlayerMoveResponse(player, fromId, toId));
        player.on('game:match:move-cell-selected', ({ id }) => this.onPlayerCellSelected(player, id));
        player.on('game:match:emoji', ({ emoji }) => this.onPlayerEmoji(player, emoji));
    }
    unbindPlayerEvents(player) {
        player.off('game:match:move-response');
        player.off('game:match:move-cell-selected');
        player.off('game:match:emoji');
    }
    getPlayersCount() {
        return Object.keys(this.players).length;
    }
    forEachPlayer(callback) {
        var _a;
        (_a = Object.values(this.players)) === null || _a === void 0 ? void 0 : _a.forEach(callback);
    }
    hasActivePlayers() {
        return this.players[player_1.PlayerTag.Player1] !== null || this.players[player_1.PlayerTag.Player2] !== null;
    }
    start() {
        this.currentPlayerTag = this.getRandomPlayerTag();
        this.forEachPlayer((player) => {
            player.resetMissedTurns();
            player.send('game:match:start', {
                playerTag: player.getTag(),
                map: this.map.serialize(),
                scores: this.getPlayerScores(),
                maxTurnTime: MaxTurnTimeSeconds
            });
        });
        setTimeout(() => this.requestNextMove(), Delay.betweenMoves);
    }
    terminate() {
        this.forEachPlayer(player => {
            if (!player)
                return;
            this.unbindPlayerEvents(player);
            player.setIdle();
            player.setOpponent(null);
        });
        this.currentPlayerTag = 0;
        if (this.callbacks.Over)
            this.callbacks.Over();
    }
    finish(isNoMoves = false) {
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
            const matchResult = {
                isWinner: !isWithdraw && winnerTag === player.getTag(),
                isWithdraw,
                isNoMoves,
                scores
            };
            player.send('game:match:over', matchResult);
            player.setIdle();
            player.setOpponent(null);
            this.unbindPlayerEvents(player);
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
        setTimeout(() => this.finish(true), emptyCellsCount * Delay.noMovesFillPerCell + 1000);
    }
    nextTurn() {
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
    }
    requestNextMove() {
        const player = this.currentPlayer();
        if (!player && !this.hasActivePlayers()) {
            this.terminate();
            return;
        }
        if (!player) {
            this.finishWithNoMoves(player_1.PlayerHasNoMovesReasons.Left);
            return;
        }
        player.send('game:match:move-request');
        player.getOpponent().send('game:match:move-pending');
        player.setTurnTimeout(() => this.onPlayerTurnTimeOut(player), MaxTurnTimeSeconds * 1000);
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
    onPlayerMoveResponse(player, fromId, toId) {
        var _a;
        player.stopTurnTimeout();
        if (this.currentPlayerTag !== player.getTag())
            return;
        if (this.validateAndMakeMove(player, fromId, toId)) {
            (_a = player.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:move-by-opponent', { fromId, toId });
            setTimeout(() => this.nextTurn(), Delay.betweenMoves);
        }
    }
    onPlayerCellSelected(player, cellId) {
        var _a;
        if (this.currentPlayerTag !== player.getTag())
            return;
        (_a = player.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:move-cell-selected', { id: cellId });
    }
    onPlayerTurnTimeOut(player) {
        player.stopTurnTimeout();
        if (player.getTag() === this.currentPlayerTag) {
            player.addMissedTurn();
            if (player.getMissedTurns() == MaxMissedTurnsCount)
                player.disconnect();
            this.nextTurn();
        }
    }
    onPlayerEmoji(player, emoji) {
        var _a;
        (_a = player.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:emoji', { emoji });
    }
    sendScoreToPlayers() {
        const scores = this.getPlayerScores();
        this.forEachPlayer(player => player === null || player === void 0 ? void 0 : player.send('game:match:scores', { scores }));
        return scores;
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