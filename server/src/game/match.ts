import { HexMap, HexNeighborLevel } from '../shared/hexmap';
import { HexMapCell } from '../shared/hexmapcell';
import { PlayerTag } from '../shared/player';
import { Client } from './client';

type PlayerList = { [key: number]: Client };

const MaxPlayers: number = 2;

export class GameMatch {

    private map: HexMap;
    private players: PlayerList = {};
    private currentPlayerTag: PlayerTag = PlayerTag.Player1;

    constructor() {
        this.map = this.createMap();
    }

    createMap(): HexMap {
        return new HexMap((cell: HexMapCell) => {
            const chance = Math.random();
            if (chance >= 0.15) {
                cell.setEmpty();
                if (chance >= 0.9) {
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

                // todo: check game over - board is full

                //if not gameover:
                this.switchPlayer();

                // todo: check game over - player has no own cells
                // todo: check game over - player has no moves

                //if still not gameover:
                this.requestNextMove();
            }
        })
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
                map: this.map.serialize()
            });
        });

        this.requestNextMove();
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