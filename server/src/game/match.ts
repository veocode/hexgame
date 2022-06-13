import { HexMap, HexNeighborLevel } from '../shared/hexmap';
import { HexMapCell } from '../shared/hexmapcell';
import { PlayerHasNoMovesReasons, PlayerTag } from '../shared/player';
import { Client } from './client';

type MatchPlayerList = { [key: number]: Client };
type MatchScoreList = {
    [key: number]: {
        nickname: string,
        score: number
    }
};

const MaxPlayers: number = 2;

type MatchOverCallback = () => void;

export class GameMatch {

    private map: HexMap;
    private players: MatchPlayerList = {};
    private currentPlayerTag: PlayerTag = PlayerTag.Player1;

    private callbacks: {
        Over?: MatchOverCallback | null
    } = {};

    constructor(serializedMap: number[]) {
        this.map = new HexMap();
        this.map.deserealize(serializedMap);
    }

    // createMap(): HexMap {
    //     let isD = 0;
    //     return new HexMap((cell: HexMapCell) => {
    //         const chance = Math.random();
    //         if (chance >= 0.15) {
    //             cell.setEmpty();

    //             if (chance >= 0.65) {
    //                 const randomPlayer = [PlayerTag.Player1, PlayerTag.Player2][Math.floor(Math.random() * 2)];

    //                 if (randomPlayer == PlayerTag.Player1 || isD < 2) {
    //                     cell.setOccupiedBy(randomPlayer);
    //                 }

    //                 if (randomPlayer === PlayerTag.Player2) {
    //                     isD += 1;
    //                 }
    //             }
    //         }
    //     });
    // }

    addPlayer(player: Client) {
        const count = this.getPlayersCount();
        if (count === MaxPlayers) return;

        const tag = { 0: PlayerTag.Player1, 1: PlayerTag.Player2 }[count];

        player.setTag(tag);
        this.bindPlayerEvents(player);

        this.players[tag] = player;
    }

    removePlayer(player: Client) {
        const tag = player.getTag();
        if ((tag in this.players) && (this.players[tag].id === player.id)) {

            this.players[tag] = null;

            if (tag === this.currentPlayerTag) {
                this.finishWithNoMoves(PlayerHasNoMovesReasons.Left);
            }
        };
    }

    bindPlayerEvents(player: Client) {
        player.on('game:match:move-response', ({ fromId, toId }) => {
            if (this.currentPlayerTag !== player.getTag()) return;

            if (this.validateAndMakeMove(player, fromId, toId)) {
                player.getOpponent()?.send('game:match:move-by-opponent', { fromId, toId });

                setTimeout(() => {
                    const scores = this.sendScoreToPlayers();

                    if (!this.mapHasEmptyCells()) return this.finish();

                    this.switchPlayer();

                    if (scores[this.currentPlayerTag].score === 0) return this.finishWithNoMoves(PlayerHasNoMovesReasons.Eliminated);
                    if (!this.players[this.currentPlayerTag]) return this.finishWithNoMoves(PlayerHasNoMovesReasons.Left);
                    if (!this.playerHasMoves(this.currentPlayerTag)) return this.finishWithNoMoves(PlayerHasNoMovesReasons.NoMoves);

                    this.requestNextMove();
                }, 1000);
            }
        });

        player.on('game:match:move-cell-selected', ({ id }) => {
            if (this.currentPlayerTag !== player.getTag()) return;
            player.getOpponent()?.send('game:match:move-cell-selected', { id });
        });
    }

    unbindPlayerEvents(player: Client) {
        player.off('game:match:move-response');
        player.off('game:match:move-cell-selected');
    }

    sendScoreToPlayers(): MatchScoreList {
        const scores = this.getPlayerScores();
        console.log('sendScoreToPlayers', scores);
        this.forEachPlayer(player => player?.send('game:match:scores', { scores }));
        return scores;
    }

    getPlayersCount(): number {
        return Object.keys(this.players).length;
    }

    forEachPlayer(callback: (player: Client) => void) {
        Object.values(this.players).forEach(callback);
    }

    start() {
        this.currentPlayerTag = this.getRandomPlayerTag();

        this.forEachPlayer((player: Client) => {
            player.send('game:match:start', {
                playerTag: player.getTag(),
                map: this.map.serialize(),
                scores: this.getPlayerScores()
            });
        });

        setTimeout(() => this.requestNextMove(), 1000);
    }

    finish() {
        const scores = this.getPlayerScores();
        let winnerTag: number = 0;
        let isWithdraw = scores[PlayerTag.Player1].score === scores[PlayerTag.Player2].score;

        if (!isWithdraw && scores[PlayerTag.Player1].score != scores[PlayerTag.Player2].score) {
            winnerTag = scores[PlayerTag.Player1].score > scores[PlayerTag.Player2].score
                ? PlayerTag.Player1
                : PlayerTag.Player2
        }

        this.forEachPlayer(player => {
            if (!player) return;

            const matchResult = {
                isWinner: winnerTag === player.getTag(),
                isWithdraw,
                scores
            };

            player.send('game:match:over', matchResult)

            player.setIdle();
            player.setOpponent(null);

            this.unbindPlayerEvents(player);
        });

        this.currentPlayerTag = 0;
        if (this.callbacks.Over) this.callbacks.Over();
    }

    finishWithNoMoves(reasonType: string) {
        const loserTag = this.currentPlayerTag;
        this.switchPlayer();
        const winnerTag = this.currentPlayerTag;

        this.forEachPlayer((player: Client) => {
            if (!player) return;
            player.send('game:match:no-moves', {
                loserTag,
                reasonType
            });
        })

        let emptyCellsCount = 0;
        const animationDelayPerCell = 120;

        this.map.getCells().forEach(cell => {
            if (cell.isEmpty()) {
                emptyCellsCount++;
                cell.setOccupiedBy(winnerTag);
            }
        })

        setTimeout(() => {
            this.finish();
        }, emptyCellsCount * animationDelayPerCell);
    }

    requestNextMove() {
        this.currentPlayer().send('game:match:move-request');
        this.currentPlayer().getOpponent().send('game:match:move-pending');
        // todo: start move/turn timer
    }

    validateAndMakeMove(player: Client, fromId: number, toId: number): boolean {
        const srcCell = this.map.getCell(fromId);
        const dstCell = this.map.getCell(toId);

        if (!srcCell.isOccupied()) return false;
        if (!dstCell.isEmpty()) return false;

        const level = this.map.getCellNeighborLevel(srcCell.id, dstCell.id);
        if (!level) return false;

        if (srcCell.getOccupiedBy() !== player.getTag()) return false;

        if (level === HexNeighborLevel.Near) {
            this.map.occupyCell(dstCell.id, player.getTag());
        }

        if (level === HexNeighborLevel.Far) {
            this.map.emptyCell(srcCell.id);
            this.map.occupyCell(dstCell.id, player.getTag());
        }

        const hostileIds = this.map.getCellHostileNeighbors(dstCell.id);
        if (hostileIds.length > 0) {
            hostileIds.forEach(hostileId => {
                this.map.occupyCell(hostileId, player.getTag())
            });
        }

        return true;
    }

    mapHasEmptyCells(): boolean {
        let hasEmpty = false;
        this.map.getCells().forEach(cell => {
            if (hasEmpty) return;
            hasEmpty = cell.isEmpty();
        });
        return hasEmpty;
    }

    getEmptyCellsCount(): number {
        let count = 0;
        this.map.getCells().forEach(cell => cell.isEmpty() && count++);
        return count;
    }

    playerHasMoves(player: PlayerTag): boolean {
        let hasMoves = false;
        this.map.getCells().forEach(cell => {
            if (hasMoves) return;
            if (!cell.isOccupiedBy(player)) return;

            const emptyNeighbors = this.map.getCellEmptyNeighbors(cell.id);
            const hasNear = emptyNeighbors[HexNeighborLevel.Near].length > 0;
            const hasFar = emptyNeighbors[HexNeighborLevel.Far].length > 0;
            hasMoves = hasNear || hasFar;
        });

        return hasMoves;
    }

    takeEmptyCellsByPlayer(player: PlayerTag) {
        this.map.getCells().forEach(cell => {
            if (cell.isEmpty()) cell.setOccupiedBy(player);
        });
    }

    getPlayerScores(): MatchScoreList {
        const scores = {}

        const tags = [PlayerTag.Player1, PlayerTag.Player2];
        tags.forEach((tag: PlayerTag) => {
            scores[tag] = {
                nickname: this.players[tag]?.nickname || '-',
                score: 0
            };
        })

        this.map.getCells().forEach(cell => {
            if (!cell.isOccupied()) return;
            scores[cell.getOccupiedBy()].score += 1;
        });

        console.log('getPlayerScores', scores);
        return scores;
    }

    private getRandomPlayerTag(): PlayerTag {
        return [PlayerTag.Player1, PlayerTag.Player2][Math.floor(Math.random() * 2)];
    }

    private switchPlayer() {
        this.currentPlayerTag = this.currentPlayerTag === PlayerTag.Player1
            ? PlayerTag.Player2
            : PlayerTag.Player1;
    }

    private currentPlayer(): Client {
        return this.players[this.currentPlayerTag];
    }

    whenOver(callback: MatchOverCallback) {
        this.callbacks.Over = callback;
    }

}