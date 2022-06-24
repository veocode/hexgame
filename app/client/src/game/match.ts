import { getLocaleTexts } from "./locales";
import { Game } from "./game";
import { HexMapCell } from "../shared/hexmapcell";
import { HexMap, HexNeighborLevel } from '../shared/hexmap';
import { Timer } from "./timer";
import { EmojisByPlayersDict } from "../ui/components/GameScreen/EmojiDisplay/EmojiDisplay";
import { PlayerColorsList, PlayerHasNoMovesReasons, PlayerTag } from "../shared/types";

export const cellAnimationTime: number = 400;
export const emojiLifeTime = 2000;

const texts = getLocaleTexts();

enum MatchState {
    MyMove = 0,
    OpponentMove,
    Over
}

export interface MatchOptions {
    map: number[],
    playerTag: number,
    initialScores: MatchServerScoreDict,
    maxTurnTime: number
}

export interface MatchStateMessage {
    text: string,
}

export type MatchScoreDict = {
    own: {
        nickname: string,
        score: number
    },
    opponent: {
        nickname: string,
        score: number
    }
};

export type MatchServerScoreDict = {
    [key: number]: {
        nickname: string,
        score: number
    }
};

export interface ServerMatchResult {
    isWinner: boolean,
    isWithdraw: boolean,
    isNoMoves: boolean,
    scores: MatchServerScoreDict
}

export interface MatchResult {
    message: string,
    scores: MatchServerScoreDict
}

type MapUpdatedCallback = (cells: HexMapCell[]) => void
type StateMessageUpdatedCallback = (stateMessage: MatchStateMessage) => void;
type ScoreUpdatedCallback = (scores: MatchScoreDict) => void;
type OverCallback = (result: MatchResult) => void;
type EmojisUpdatedCallback = (emojis: EmojisByPlayersDict) => void;
type EmojisLockUpdatedCallback = (isLocked: boolean) => void;

export type MatchScoreList = {
    own: {
        nickname: string,
        score: number
    },
    opponent: {
        nickname: string,
        score: number
    }
};

export class Match {

    protected map: HexMap;
    protected playerTag: PlayerTag = PlayerTag.Player1;

    protected emojis: EmojisByPlayersDict = { 1: null, 2: null };
    protected isEmojisLocked: boolean = false;

    protected state: MatchState = MatchState.OpponentMove;
    protected isMoveDone: boolean = false;
    protected selectedCell: HexMapCell | null = null;
    protected scores: MatchScoreList | null = null;
    protected result: MatchResult | null = null;

    protected maxTurnTime: number = 30;
    protected turnTimer: Timer = new Timer();

    protected callbacks: {
        MapUpdated?: MapUpdatedCallback | null,
        StateMessageUpdated?: StateMessageUpdatedCallback | null,
        ScoreUpdated?: ScoreUpdatedCallback | null,
        Over?: OverCallback | null,
        EmojisUpdated?: EmojisUpdatedCallback | null,
        EmojisLockUpdated?: EmojisLockUpdatedCallback | null
    } = {};

    constructor(
        protected game: Game,
        protected options: MatchOptions
    ) {
        this.map = new HexMap();
        this.map.deserealize(options.map);

        this.playerTag = options.playerTag;
        this.maxTurnTime = options.maxTurnTime;

        this.updateScores(options.initialScores);
        this.bindSocketEvents();
    }

    getGame(): Game {
        return this.game;
    }

    isSpectating(): boolean {
        return false;
    }

    getInitialStateMessage() {
        return '';
    }

    bindSocketEvents() {
        this.game.socket.on('game:match:move-request', () => {
            this.turnTimer.start(this.maxTurnTime, () => {
                this.updateStateMessage({
                    text: this.turnTimer.formatLeft(texts.YourTurn),
                })
            });

            this.map.resetHighlight();
            this.redrawMap();

            this.isMoveDone = false;
            this.setMyMove();
        })

        this.game.socket.on('game:match:move-pending', () => {
            this.turnTimer.start(this.maxTurnTime, () => {
                this.updateStateMessage({
                    text: this.turnTimer.formatLeft(texts.OpponentTurn),
                })
            });

            this.setOpponentMove();
            this.map.resetHighlight();
            this.redrawMap();
        })

        this.game.socket.on('game:match:move-by-opponent', async ({ fromId, toId }) => {
            this.map.resetHighlight();
            await this.makeMove(fromId, toId, true);
        })

        this.game.socket.on('game:match:move-cell-selected', async ({ id }) => {
            this.map.resetHighlight();
            if (id) this.map.highlightCellNeighbors(id);
            this.redrawMap();
        })

        this.game.socket.on('game:match:no-moves', async ({ loserTag, reasonType }) => {
            this.turnTimer.stop();
            this.map.resetHighlight();

            const reasons: { [key: string]: string } = {}
            reasons[PlayerHasNoMovesReasons.Left] = texts.OpponentLeft;
            reasons[PlayerHasNoMovesReasons.Eliminated] = texts.OpponentEliminated;
            reasons[PlayerHasNoMovesReasons.NoMoves] = texts.OpponentNoMoves;

            const winnerTag = loserTag === this.playerTag ? this.getOpponentTag() : this.playerTag;
            const stateText = loserTag === this.playerTag
                ? texts.NoMoves
                : reasons[reasonType];

            this.updateStateMessage({ text: stateText });

            setTimeout(() => {
                const emptyCells = this.getMap().getCells().filter(cell => cell.isEmpty());
                this.shuffleArray(emptyCells);

                const occupyNextCell = () => {
                    if (emptyCells.length === 0) return;
                    const cell = emptyCells.pop();
                    cell?.setOccupiedBy(winnerTag);
                    this.redrawMap();
                    setTimeout(() => occupyNextCell(), 200);
                }

                occupyNextCell();
            }, 500);
        })

        this.game.socket.on('game:match:scores', ({ scores }) => {
            this.updateScores(scores);
        })

        this.game.socket.on('game:match:over', ({ isWinner, isWithdraw, isNoMoves, scores }) => {
            this.turnTimer.stop();

            const message = isWithdraw
                ? texts.MatchWithdraw
                : (isWinner ? texts.MatchWon : texts.MatchLost);

            this.setOver(isNoMoves, {
                message,
                scores
            });
        })

        this.game.socket.on('game:match:emoji', async ({ emoji }) => {
            this.playerSetEmoji(this.getOpponentTag(), emoji);
        })
    }

    unbindSocketEvents() {
        this.game.socket.off('game:match:move-request');
        this.game.socket.off('game:match:move-pending');
        this.game.socket.off('game:match:move-cell-selected');
        this.game.socket.off('game:match:move-by-opponent');
        this.game.socket.off('game:match:no-moves');
        this.game.socket.off('game:match:scores');
        this.game.socket.off('game:match:over');
        this.game.socket.off('game:match:emoji');
    }

    getPlayerColors(): PlayerColorsList {
        if (this.playerTag === PlayerTag.Player1) {
            return {
                1: 'own',
                2: 'enemy',
            }
        }

        return {
            2: 'own',
            1: 'enemy',
        }
    }

    getMap(): HexMap {
        return this.map;
    }

    async onCellClick(id: number) {
        if (this.isSpectating()) return;

        const cell = this.map.getCell(id);

        if (!this.isMyMove()) {
            return;
        }

        if (cell.isNone() || (!cell.isEmpty() && !cell.isOccupiedBy(this.playerTag))) {
            this.map.resetHighlight();
            this.selectedCell = null;
        }

        if (cell.isOccupiedBy(this.playerTag)) {
            if (!this.selectedCell || this.selectedCell.id !== cell.id) {
                this.selectCell(cell);
            }
        }

        if (cell.isEmpty() && this.selectedCell) {
            this.map.resetHighlight();
            if (this.isMyMove() && !this.isMoveDone) {
                await this.makeMove(this.selectedCell.id, cell.id);
            }
            this.selectedCell = null;
        }

        if (this.selectedCell === null) {
            this.game.socket.emit('game:match:move-cell-selected', { id: null });
        }

        this.redrawMap();
    }

    selectCell(cell: HexMapCell) {
        if (!cell.isOccupiedBy(this.playerTag)) return;

        if (this.selectedCell) this.map.resetHighlight();
        this.selectedCell = cell;
        this.map.highlightCellNeighbors(cell.id);
        this.game.socket.emit('game:match:move-cell-selected', { id: cell.id });
    }

    makeMove(fromId: number, toId: number, isOpponent: boolean = false): Promise<boolean> {
        return new Promise<boolean>(async resolve => {
            const srcCell = this.map.getCell(fromId);
            const dstCell = this.map.getCell(toId);

            if (!srcCell.isOccupied()) return resolve(false);
            if (!dstCell.isEmpty()) return resolve(false);

            const level = this.map.getCellNeighborLevel(srcCell.id, dstCell.id);
            if (!level) return resolve(false);

            const player = srcCell.getOccupiedBy();
            if (!player) return resolve(false);

            if (!isOpponent) {
                this.game.socket.emit('game:match:move-response', { fromId, toId });
                this.isMoveDone = true;
            }

            if (level === HexNeighborLevel.Near) {
                await this.occupyCellByPlayer(dstCell.id, player);
            }

            if (level === HexNeighborLevel.Far) {
                await this.freeCell(srcCell.id);
                await this.occupyCellByPlayer(dstCell.id, player);
            }

            const hostileIds = this.map.getCellHostileNeighbors(dstCell.id);
            if (hostileIds.length > 0) {
                await this.freeCells(hostileIds);
                await this.occupyCellsByPlayer(hostileIds, player);
            }

            resolve(true);
        });
    }

    occupyCellsByPlayer(ids: number[], player: PlayerTag): Promise<void> {
        return new Promise<void>(resolve => {
            ids.forEach(id => this.map.occupyCell(id, player));
            this.redrawMap();
            setTimeout(resolve, cellAnimationTime);
        });
    }

    occupyCellByPlayer(id: number, player: PlayerTag): Promise<void> {
        return new Promise<void>(resolve => {
            if (this.map.occupyCell(id, player)) {
                this.redrawMap();
                setTimeout(resolve, cellAnimationTime);
            } else {
                resolve();
            }
        });
    }

    freeCells(ids: number[]): Promise<void> {
        return new Promise<void>(resolve => {
            ids.forEach(id => this.map.freeCell(id));
            this.redrawMap();
            setTimeout(() => {
                ids.forEach(id => this.map.emptyCell(id));
                resolve();
            }, cellAnimationTime);
        });
    }

    freeCell(id: number): Promise<void> {
        return new Promise<void>(resolve => {
            if (this.map.freeCell(id)) {
                this.redrawMap();
                setTimeout(() => {
                    this.map.emptyCell(id);
                    resolve();
                }, cellAnimationTime);
            } else {
                resolve();
            }
        });
    }

    redrawMap() {
        if (this.callbacks.MapUpdated) {
            this.callbacks.MapUpdated(this.map.getCells());
        }
    }

    whenMapUpdated(callback: MapUpdatedCallback) {
        this.callbacks.MapUpdated = callback;
    }

    updateStateMessage(stateMessage: MatchStateMessage) {
        if (this.callbacks.StateMessageUpdated) {
            this.callbacks.StateMessageUpdated(stateMessage);
        }
    }

    whenStateMessageUpdated(callback: StateMessageUpdatedCallback) {
        this.callbacks.StateMessageUpdated = callback;
    }

    updateScores(scores: MatchServerScoreDict) {
        const matchScores = {
            own: { ...scores[this.playerTag] },
            opponent: { ...scores[this.getOpponentTag()] },
        }

        this.scores = matchScores;

        if (this.callbacks.ScoreUpdated) {
            this.callbacks.ScoreUpdated(matchScores);
        }
    }

    whenScoreUpdated(callback: ScoreUpdatedCallback) {
        this.callbacks.ScoreUpdated = callback;
    }

    getScores(): MatchScoreDict | null {
        return this.scores;
    }

    whenOver(callback: OverCallback) {
        this.callbacks.Over = callback;
    }

    getState(): MatchState {
        return this.state;
    }

    isMyMove() {
        return this.state === MatchState.MyMove;
    }

    setMyMove() {
        this.state = MatchState.MyMove;
        this.updateStateMessage({
            text: this.turnTimer.formatLeft(texts.YourTurn),
        })
    }

    isOpponentMove() {
        return this.state === MatchState.OpponentMove;
    }

    setOpponentMove() {
        this.state = MatchState.OpponentMove;
        this.updateStateMessage({
            text: this.turnTimer.formatLeft(texts.OpponentTurn),
        })
    }

    setOver(isNoMoves: boolean, result: MatchResult) {
        this.state = MatchState.Over;
        if (!isNoMoves) {
            this.updateStateMessage({
                text: texts.MatchOver,
            });
        }
        this.updateScores(result.scores);
        if (this.callbacks.Over) {
            this.callbacks.Over(result);
        }
    }

    isOver() {
        return this.state === MatchState.Over;
    }

    getResult(): MatchResult | null {
        if (!this.isOver()) return null;
        return this.result;
    }

    shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    sendEmoji(emoji: string) {
        this.game.socket.emit('game:match:emoji', { emoji });
        this.playerSetEmoji(this.playerTag, emoji);
        this.lockEmojis(true);
    }

    lockEmojis(isLocked: boolean) {
        this.isEmojisLocked = isLocked;

        if (isLocked) {
            setTimeout(() => { this.lockEmojis(false); }, 3000);
        }

        if (this.callbacks.EmojisLockUpdated) {
            this.callbacks.EmojisLockUpdated(this.isEmojisLocked);
        }
    }

    isEmojisLockedForCooldown(): boolean {
        return this.isEmojisLocked;
    }

    whenEmojisLockUpdated(callback: EmojisLockUpdatedCallback) {
        this.callbacks.EmojisLockUpdated = callback;
    }

    getCurrentEmojis(): EmojisByPlayersDict {
        return { ...this.emojis };
    }

    playerSetEmoji(playerTag: PlayerTag, emoji: string) {
        if (this.playerTag !== PlayerTag.Player1) {
            playerTag = playerTag === PlayerTag.Player1
                ? PlayerTag.Player2
                : PlayerTag.Player1;
        }

        if (this.emojis[playerTag] !== null) return;

        this.emojis[playerTag] = emoji;
        this.updateEmojis();

        setTimeout(() => {
            this.emojis[playerTag] = null;
            this.updateEmojis();
        }, emojiLifeTime);
    }

    updateEmojis() {
        if (this.callbacks.EmojisUpdated) {
            this.callbacks.EmojisUpdated(this.emojis);
        }
    }

    whenEmojisUpdated(callback: EmojisUpdatedCallback) {
        this.callbacks.EmojisUpdated = callback;
    }

    getPlayerTag(): PlayerTag {
        return this.playerTag;
    }

    getOpponentTag(): PlayerTag {
        return this.playerTag === PlayerTag.Player1
            ? PlayerTag.Player2
            : PlayerTag.Player1;
    }

}