import { HexMap, HexNeighborLevel } from '../shared/hexmap';
import { HexMapCell } from '../shared/hexmapcell';
import { PlayerTag } from '../shared/player';
import { Client } from './client';

type MatchPlayerList = { [key: number]: Client };
type MatchScoreList = {
    [key: number]: {
        nickname: string,
        score: number
    }
};

const MaxPlayers: number = 2;

export class GameMatch {

    private map: HexMap;
    private players: MatchPlayerList = {};
    private currentPlayerTag: PlayerTag = PlayerTag.Player1;

    constructor() {
        this.map = this.createMap();
    }

    createMap(): HexMap {
        return new HexMap((cell: HexMapCell) => {
            const chance = Math.random();
            if (chance >= 0.15) {
                cell.setEmpty();
                if (chance >= 0.2) {
                    const randomPlayer = [PlayerTag.Player1, PlayerTag.Player2][Math.floor(Math.random() * 2)];
                    cell.setOccupiedBy(randomPlayer);
                }
            }
        });
    }

    addPlayer(client: Client) {
        const count = this.getPlayersCount();
        if (count === MaxPlayers) return;

        const tag = { 0: PlayerTag.Player1, 1: PlayerTag.Player2 }[count];

        client.setTag(tag);
        this.bindPlayerEvents(client);

        this.players[tag] = client;
    }

    bindPlayerEvents(player: Client) {
        player.on('game:match-move:response', ({ fromId, toId }) => {
            if (this.currentPlayerTag !== player.getTag()) return;

            if (this.validateAndMakeMove(player, fromId, toId)) {
                player.getOpponent().send('game:match-move:opponent', { fromId, toId });

                const scores = this.getPlayerScores();
                player.send('game:match-scores', { scores });
                player.getOpponent().send('game:match-scores', { scores });

                if (!this.mapHasEmptyCells()) return this.finish();
                this.switchPlayer();

                if (!this.playerHasMoves(this.currentPlayerTag)) return this.finish();
                this.requestNextMove();
            }
        });

        player.on('game:match-move:cell-selected', ({ id }) => {
            console.log('cell-selected', id);
            player.getOpponent().send('game:match-move:cell-selected', { id });
        });
    }

    unbindPlayerEvents(player: Client) {
        player.off('game:match-move:response');
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
            player.send('game:match-start', {
                playerTag: player.getTag(),
                map: this.map.serialize(),
                scores: this.getPlayerScores()
            });
        });

        setTimeout(() => this.requestNextMove(), 250);
    }

    finish() {
        const scores = this.getPlayerScores();
        let winnerTag: number = 0;

        if (scores[PlayerTag.Player1] != scores[PlayerTag.Player2]) {
            winnerTag = scores[PlayerTag.Player1] > scores[PlayerTag.Player2]
                ? PlayerTag.Player1
                : PlayerTag.Player2
        }

        this.forEachPlayer(player => {
            player.send('game:match-over', {
                isWinner: winnerTag === player.getTag(),
                scores
            })

            player.setIdle();
        });
    }

    requestNextMove() {
        this.currentPlayer().send('game:match-move:request');
        this.currentPlayer().getOpponent().send('game:match-move:pending');

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

    getPlayerScores(): MatchScoreList {
        const scores = {}

        const tags = [PlayerTag.Player1, PlayerTag.Player2];
        tags.forEach((tag: PlayerTag) => {
            scores[tag] = {
                nickname: this.players[tag].nickname,
                score: 0
            };
        })

        this.map.getCells().forEach(cell => {
            if (!cell.isOccupied()) return;
            scores[cell.getOccupiedBy()].score += 1;
        });

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

}