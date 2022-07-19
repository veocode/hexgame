import { Game } from "./game";
import { getLocaleTexts } from "./locales";
import { emojiLifeTime, Match, MatchServerScoreDict, ServerMatchResult } from "./match";
import { PlayerTag, PlayerColorsList, PlayerHasNoMovesReasons } from "../shared/types";

const texts = getLocaleTexts();

export interface SpectateMatchOptions {
    map: number[],
    currentPlayer: number,
    initialScores: MatchServerScoreDict,
    maxTurnTime: number,
    spectators: number,
    hasBot: boolean
}

export class SpectateMatch extends Match {

    protected serverScores: MatchServerScoreDict | null = null;

    constructor(game: Game, private opts: SpectateMatchOptions) {
        super(game, {
            playerTag: 0,
            ...opts
        })
    }

    isSpectating(): boolean {
        return true;
    }

    getInitialStateMessage() {
        return `⏳ ${this.getPlayerName(this.opts.currentPlayer)}`;
    }

    onMoveStarted(player: PlayerTag) {
        this.updateStateMessage({
            text: `⏳ ${this.getPlayerName(player)} (30)`,
        })
        this.turnTimer.start(this.maxTurnTime, () => {
            this.updateStateMessage({
                text: this.turnTimer.formatLeft(`⏳ ${this.getPlayerName(player)}`),
            })
        });
        this.map.resetHighlight();
        this.redrawMap();
    }

    bindSocketEvents() {
        this.game.socket.on('game:match:move-started', ({ player }) => {
            this.onMoveStarted(player);
        })

        this.game.socket.on('game:match:move-done', async ({ player, fromId, toId }) => {
            this.map.resetHighlight();
            await this.makeMove(fromId, toId, true);
        })

        this.game.socket.on('game:match:move-cell-selected', async ({ player, id }) => {
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

            const winnerTag = loserTag === PlayerTag.Player1 ? PlayerTag.Player2 : PlayerTag.Player1;
            this.updateStateMessage({ text: `🔴 ${this.getPlayerName(loserTag)}` });

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

        this.game.socket.on('game:match:over', (result: ServerMatchResult) => {
            this.turnTimer.stop();

            const message = result.isWithdraw
                ? texts.MatchWithdraw
                : `👑 ${this.getPlayerName(result.winner)}`;

            this.setOver(result.isNoMoves, {
                message,
                ...result
            });
        })

        this.game.socket.on('game:match:emoji', async ({ player, emoji }) => {
            this.playerSetEmoji(player, emoji);
        })

        this.game.socket.on('game:match:spectators', ({ count }) => {
            if (count !== this.spectatorCount) {
                this.spectatorCount = count;
                this.callbacks.SpectatorCountUpdated?.call(this, count);
            }
        })
    }

    unbindSocketEvents() {
        this.game.socket.off('game:match:move-started');
        this.game.socket.off('game:match:move-done');
        this.game.socket.off('game:match:move-cell-selected');
        this.game.socket.off('game:match:no-moves');
        this.game.socket.off('game:match:scores');
        this.game.socket.off('game:match:over');
        this.game.socket.off('game:match:emoji');
    }

    updateScores(scores: MatchServerScoreDict) {
        this.serverScores = scores;
        this.scores = {
            own: { ...scores[PlayerTag.Player1] },
            opponent: { ...scores[PlayerTag.Player2] },
        };

        if (this.callbacks.ScoreUpdated) {
            this.callbacks.ScoreUpdated(this.scores);
        }
    }

    playerSetEmoji(playerTag: PlayerTag, emoji: string) {
        this.emojis[playerTag] = emoji;
        this.updateEmojis();

        setTimeout(() => {
            this.emojis[playerTag] = null;
            this.updateEmojis();
        }, emojiLifeTime);
    }

    getPlayerName(player: PlayerTag): string {
        return this.opts.initialScores[player].nickname;
    }

    getPlayerColors(): PlayerColorsList {
        return {
            1: 'own',
            2: 'enemy',
        }
    }

}