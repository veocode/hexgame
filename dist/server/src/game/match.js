"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameMatch = void 0;
const hexmap_1 = require("../shared/hexmap");
const types_1 = require("../shared/types");
const client_1 = require("../client/client");
const utils_1 = require("./utils");
const MaxPlayers = 2;
const MaxTurnTimeSeconds = 30000;
const MaxMissedTurnsCount = 3;
const Delay = {
    noMovesFillPerCell: 200,
    betweenMoves: 800
};
class GameMatch {
    constructor(serializedMap) {
        this.isStopped = false;
        this.players = {};
        this.spectators = new client_1.ClientList();
        this.currentPlayerTag = types_1.PlayerTag.Player1;
        this.turnCounter = 0;
        this.linkedGame = null;
        this.callbacks = {};
        this.id = (0, utils_1.generateId)();
        this.map = new hexmap_1.HexMap();
        this.map.deserealize(serializedMap);
    }
    getMap() {
        return this.map;
    }
    getTurn() {
        return this.turnCounter;
    }
    setLinkedGame(linkedGame) {
        this.linkedGame = linkedGame;
    }
    hasLinkedGame() {
        return this.linkedGame !== null;
    }
    getLinkedGame() {
        return this.linkedGame;
    }
    hasBot() {
        let hasBot = false;
        this.forEachPlayer(player => { hasBot = hasBot || player && player.isBot(); });
        return hasBot;
    }
    addPlayer(player) {
        const count = this.getPlayersCount();
        if (count === MaxPlayers)
            return;
        const tag = { 0: types_1.PlayerTag.Player1, 1: types_1.PlayerTag.Player2 }[count];
        player.setTag(tag);
        this.bindPlayerEvents(player);
        this.players[tag] = player;
    }
    removePlayer(player) {
        const tag = player.getTag();
        if (tag in this.players) {
            this.players[tag] = null;
            if (tag === this.currentPlayerTag) {
                this.finishWithNoMoves(types_1.PlayerHasNoMovesReasons.Left);
            }
        }
        ;
        if (this.spectators.hasId(player.id)) {
            this.removeSpectator(player);
        }
    }
    getPlayer(tag) {
        return this.players[tag];
    }
    getPlayerId(tag) {
        const player = this.getPlayer(tag);
        return player ? player.id : '';
    }
    bindPlayerEvents(player) {
        player.on('game:match:move-response', ({ fromId, toId }) => this.onPlayerMoveResponse(player, fromId, toId));
        player.on('game:match:move-cell-selected', ({ id }) => this.onPlayerCellSelected(player, id));
        player.on('game:match:emoji', ({ emoji }) => this.onPlayerEmoji(player, emoji));
        player.on('game:match:surrender', () => this.onPlayerSurrender(player));
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
        return this.players[types_1.PlayerTag.Player1] !== null || this.players[types_1.PlayerTag.Player2] !== null;
    }
    hasSpectator(spectator) {
        return this.spectators.hasId(spectator.id);
    }
    addSpectator(spectator) {
        spectator.setMatch(this);
        this.spectators.add(spectator);
        spectator.send('game:match:start-spectating', {
            map: this.map.serialize(),
            scores: this.getPlayerScores(),
            currentPlayer: this.currentPlayerTag,
            maxTurnTime: MaxTurnTimeSeconds,
            hasBot: this.hasBot(),
        });
        this.forEachPlayerAndSpectator(client => client.send('game:match:spectators', {
            count: this.spectators.count()
        }));
    }
    forEachPlayerAndSpectator(callback) {
        this.forEachPlayer(player => callback(player));
        this.forEachSpectator(spectator => callback(spectator));
    }
    removeSpectator(spectator) {
        this.spectators.remove(spectator);
        this.forEachPlayerAndSpectator(client => client.send('game:match:spectators', {
            count: this.spectators.count()
        }));
    }
    getSpectators() {
        return this.spectators;
    }
    getSpectatorsCount() {
        return this.spectators.count();
    }
    hasSpectators() {
        return this.getSpectatorsCount() > 0;
    }
    forEachSpectator(callback) {
        this.spectators.forEach(spectator => callback(spectator));
    }
    start() {
        this.turnCounter = 0;
        this.currentPlayerTag = this.getRandomPlayerTag();
        this.forEachPlayer((player) => {
            player.resetMissedTurns();
            player.send('game:match:start', {
                playerTag: player.getTag(),
                map: this.map.serialize(),
                scores: this.getPlayerScores(),
                maxTurnTime: MaxTurnTimeSeconds,
                hasBot: this.hasBot()
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
        this.spectators.disconnect();
        this.currentPlayerTag = 0;
        if (this.callbacks.Over)
            this.callbacks.Over(null);
    }
    finish(isNoMoves = false) {
        const scores = this.getPlayerScores();
        const scorePlayer1 = scores[types_1.PlayerTag.Player1].score;
        const scorePlayer2 = scores[types_1.PlayerTag.Player2].score;
        const isWithdraw = scorePlayer1 === scorePlayer2;
        let winnerTag = 0;
        if (!isWithdraw) {
            winnerTag = scorePlayer1 > scorePlayer2
                ? types_1.PlayerTag.Player1
                : types_1.PlayerTag.Player2;
        }
        const isLinkedGame = this.hasLinkedGame();
        this.forEachPlayer(player => {
            var _a;
            if (!player)
                return;
            const opponentMultiplier = ((_a = player.getOpponent()) === null || _a === void 0 ? void 0 : _a.getScoreMultiplier()) || 1;
            const playerScores = player.getProfile().getScore();
            const pointsEarned = isLinkedGame ? 0 : Math.round(scores[player.getTag()].delta * opponentMultiplier);
            const pointsToday = Math.max(playerScores.today + pointsEarned, 0);
            const pointsTotal = Math.max(playerScores.total + pointsEarned, 0);
            const matchResult = {
                winner: winnerTag,
                isWinner: !isWithdraw && winnerTag === player.getTag(),
                isWithdraw,
                isNoMoves,
                isLinkedGame,
                pointsEarned,
                pointsToday,
                pointsTotal,
                scores
            };
            player.send('game:match:over', matchResult);
            player.setIdle();
            player.setOpponent(null);
            this.unbindPlayerEvents(player);
        });
        this.spectators.send('game:match:over', {
            winner: winnerTag,
            isWithdraw,
            isNoMoves,
            scores
        });
        this.currentPlayerTag = 0;
        if (this.callbacks.Over)
            this.callbacks.Over(scores);
    }
    finishWithNoMoves(reasonType) {
        if (this.isStopped)
            return;
        this.isStopped = true;
        const loserTag = this.currentPlayerTag;
        const winnerTag = loserTag === types_1.PlayerTag.Player2
            ? types_1.PlayerTag.Player1
            : types_1.PlayerTag.Player2;
        this.forEachPlayer((player) => {
            if (!player)
                return;
            player.send('game:match:no-moves', {
                loserTag,
                reasonType
            });
        });
        this.spectators.send('game:match:no-moves', {
            loserTag,
            reasonType
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
        if (this.isStopped)
            return;
        const scores = this.sendScoreToPlayers();
        if (!this.mapHasEmptyCells())
            return this.finish();
        this.switchPlayer();
        if (scores[this.currentPlayerTag].score === 0)
            return this.finishWithNoMoves(types_1.PlayerHasNoMovesReasons.Eliminated);
        if (!this.players[this.currentPlayerTag])
            return this.finishWithNoMoves(types_1.PlayerHasNoMovesReasons.Left);
        if (!this.playerHasMoves(this.currentPlayerTag))
            return this.finishWithNoMoves(types_1.PlayerHasNoMovesReasons.NoMoves);
        this.requestNextMove();
    }
    requestNextMove() {
        if (this.isStopped)
            return;
        const player = this.currentPlayer();
        if ((!player || !player.isConnected()) && !this.hasActivePlayers()) {
            this.terminate();
            return;
        }
        if ((!player || !player.isConnected())) {
            this.finishWithNoMoves(types_1.PlayerHasNoMovesReasons.Left);
            return;
        }
        this.turnCounter++;
        this.spectators.send('game:match:move-started', {
            player: player.getTag()
        });
        player.send('game:match:move-request');
        const opponent = player.getOpponent();
        if (!opponent || !opponent.isConnected()) {
            this.terminate();
            return;
        }
        opponent.send('game:match:move-pending');
        player.setTurnTimeout(() => this.onPlayerTurnTimeOut(player), MaxTurnTimeSeconds * 1000);
    }
    validateAndMakeMove(player, fromId, toId) {
        if (this.isStopped)
            return false;
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
    stopTimeouts() {
        var _a, _b;
        (_a = this.players[types_1.PlayerTag.Player1]) === null || _a === void 0 ? void 0 : _a.stopTurnTimeout();
        (_b = this.players[types_1.PlayerTag.Player2]) === null || _b === void 0 ? void 0 : _b.stopTurnTimeout();
    }
    onPlayerSurrender(player) {
        this.currentPlayerTag = player.getTag();
        this.finishWithNoMoves(types_1.PlayerHasNoMovesReasons.Eliminated);
    }
    onPlayerMoveResponse(player, fromId, toId) {
        var _a;
        if (this.isStopped)
            return;
        player.stopTurnTimeout();
        if (this.currentPlayerTag !== player.getTag())
            return;
        if (this.validateAndMakeMove(player, fromId, toId)) {
            (_a = player.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:move-by-opponent', { fromId, toId });
            this.spectators.send('game:match:move-done', {
                player: player.getTag(),
                fromId,
                toId
            });
            setTimeout(() => this.nextTurn(), Delay.betweenMoves);
        }
    }
    onPlayerCellSelected(player, cellId) {
        var _a;
        if (this.isStopped)
            return;
        if (this.currentPlayerTag !== player.getTag())
            return;
        (_a = player.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:move-cell-selected', { id: cellId });
        this.spectators.send('game:match:move-cell-selected', {
            player: player.getTag(),
            id: cellId
        });
    }
    onPlayerTurnTimeOut(player) {
        if (this.isStopped)
            return;
        player.stopTurnTimeout();
        if (player.getTag() === this.currentPlayerTag) {
            player.addMissedTurn();
            if (player.getMissedTurns() == MaxMissedTurnsCount) {
                return this.finishWithNoMoves(types_1.PlayerHasNoMovesReasons.Left);
            }
            this.nextTurn();
        }
    }
    onPlayerEmoji(player, emoji) {
        var _a;
        (_a = player.getOpponent()) === null || _a === void 0 ? void 0 : _a.send('game:match:emoji', { emoji });
        this.spectators.send('game:match:emoji', { player: player.getTag(), emoji });
    }
    sendScoreToPlayers() {
        const scores = this.getPlayerScores();
        this.forEachPlayer(player => player === null || player === void 0 ? void 0 : player.send('game:match:scores', { scores }));
        this.spectators.send('game:match:scores', { scores });
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
        const tags = [types_1.PlayerTag.Player1, types_1.PlayerTag.Player2];
        tags.forEach(tag => {
            var _a;
            scores[tag] = {
                nickname: ((_a = this.players[tag]) === null || _a === void 0 ? void 0 : _a.getAuthInfo().nickname) || '-',
                score: 0,
                delta: 0,
            };
        });
        this.map.getCells().forEach(cell => {
            if (!cell.isOccupied())
                return;
            scores[cell.getOccupiedBy()].score += 1;
        });
        tags.forEach(tag => {
            const opponentTag = tag === types_1.PlayerTag.Player1
                ? types_1.PlayerTag.Player2
                : types_1.PlayerTag.Player1;
            scores[tag].delta = scores[tag].score - scores[opponentTag].score;
        });
        return scores;
    }
    getRandomPlayerTag() {
        return [types_1.PlayerTag.Player1, types_1.PlayerTag.Player2][Math.floor(Math.random() * 2)];
    }
    switchPlayer() {
        this.currentPlayerTag = this.currentPlayerTag === types_1.PlayerTag.Player1
            ? types_1.PlayerTag.Player2
            : types_1.PlayerTag.Player1;
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