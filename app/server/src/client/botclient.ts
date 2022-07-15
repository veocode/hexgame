import { HexMap, HexNeighborLevel } from "../shared/hexmap";
import { HexMapCell } from "../shared/hexmapcell";
import { PlayerHasNoMovesReasons, PlayerTag } from "../shared/types";
import { Client } from "./client";
import { generateId } from "../game/utils";
import { Profile } from "./profile";

type SocketCallback = (...args: any[]) => void;
type CallbackDict = { [eventName: string]: SocketCallback };

type PossibleMove = {
    id: string,
    fromCell: HexMapCell,
    toCell: HexMapCell,
    profit: number,
    isJump: boolean
}

type PossibleMoveList = {
    all: PossibleMove[],
    near: PossibleMove[],
    far: PossibleMove[],
}

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

export class BotClient extends Client {

    private botId: string = '';
    private botNickname: string = '';

    private callbacks: CallbackDict = {};

    static getRandomName(): string {
        return botNames[Math.floor(Math.random() * botNames.length)];
    }

    constructor(profile: Profile) {
        super(null, profile);
        this.botNickname = profile.nickname;
    }

    isBot(): boolean {
        return true;
    }

    isConnected(): boolean {
        return true;
    }

    getId(): string {
        if (this.botId) return this.botId;
        return this.botId = generateId();
    }

    getNickname(): string {
        if (this.botNickname) return this.botNickname;
        return this.botNickname = this.shuffleArray(botNames)[0];
    }

    private callback(eventName: string, data: any) {
        if (eventName in this.callbacks) {
            this.callbacks[eventName](data);
        }
    }

    on(eventName: string, callback: SocketCallback) {
        this.callbacks[eventName] = callback;
    }

    off(eventName: string) {
        // delete this.callbacks[eventName];
    }

    send(eventName, data: any) {
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
                if (reasonType !== PlayerHasNoMovesReasons.Left) {
                    if (loserTag === this.getTag()) {
                        this.sendEmoji(this.shuffleArray(['👍', '☹️', '😡', '😭'])[0], 400);
                    } else {
                        this.sendEmoji(this.shuffleArray(['😎', '😀', '😛'])[0], 400);
                    }
                }
            }
        }
    }

    private sendEmoji(emoji: string, delay: number = 0) {
        if (delay) {
            setTimeout(() => this.callback('game:match:emoji', { emoji }), delay);
        } else {
            this.callback('game:match:emoji', { emoji });
        }
    }

    private respondWithMove() {
        const moves = this.getPossibleMoves();

        if (moves.all.length === 1) return this.makeMove(moves.all[0]);

        moves.all.sort((move1, move2) => {
            if (move1.profit === move2.profit) {
                return Math.random() < 0.5 ? 1 : -1;
            }
            return move2.profit - move1.profit;
        });

        return this.makeMove(moves.all[0]);
    }

    private getNextBestMove(moves: PossibleMoveList): PossibleMove {
        if (moves.all.length === 1) {
            return moves.all[0];
        }
    }

    private makeMove(move: PossibleMove) {
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
        }, 300)
    }

    getPossibleMoves(map?: HexMap, myTag?: PlayerTag, opponentTag?: PlayerTag): PossibleMoveList {
        map = map || this.match.getMap();
        myTag = myTag || this.getTag();
        opponentTag = opponentTag || this.getOpponent().getTag();

        const moves: PossibleMoveList = {
            all: [],
            far: [],
            near: [],
        }

        const levels: HexNeighborLevel[] = [
            HexNeighborLevel.Near,
            HexNeighborLevel.Far
        ];

        map.getCells().forEach(cell => {
            if (!cell.isOccupiedBy(myTag)) return;

            const emptyNeighbors = map.getCellEmptyNeighbors(cell.id);
            const hasNear = emptyNeighbors[HexNeighborLevel.Near].length > 0;
            const hasFar = emptyNeighbors[HexNeighborLevel.Far].length > 0;
            const hasMoves = hasNear || hasFar;
            if (!hasMoves) { return; }

            const ownToLoseInCounter = map.isCellCanBeAttacked(cell.id, opponentTag)
                ? map.getCellAllyNeighbors(cell.id, myTag).length
                : 0;

            levels.forEach(level => {
                emptyNeighbors[level].forEach(emptyCellId => {
                    const emptyCell = map.getCell(emptyCellId);
                    const hostiles = map.getCellHostileNeighbors(emptyCellId, myTag);
                    const isJump = level === HexNeighborLevel.Far;

                    let hostileToCapture = 0;
                    hostiles.forEach(hostileId => {
                        const hostileProfit = map.isCellCanBeAttacked(hostileId, opponentTag, hostiles) ? 1 : 2;
                        hostileToCapture += hostileProfit;
                    })

                    const move: PossibleMove = {
                        id: `${cell.id}-${emptyCell.id}`,
                        fromCell: cell,
                        toCell: emptyCell,
                        profit: hostileToCapture - ownToLoseInCounter + (isJump ? 0 : 1),
                        isJump,
                    };

                    moves.all.push(move);
                    move.isJump ? moves.far.push(move) : moves.near.push(move);
                })
            })
        });

        return moves;
    }

    shuffleArray(sourceArray: any[]): any[] {
        const array = [...sourceArray];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getRandomArrayItem(array: any[]): any {
        return array[Math.floor(Math.random() * array.length)];
    }

}