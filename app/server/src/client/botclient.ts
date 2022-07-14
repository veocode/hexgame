import { HexNeighborLevel } from "../shared/hexmap";
import { HexMapCell } from "../shared/hexmapcell";
import { PlayerHasNoMovesReasons } from "../shared/types";
import { Client } from "./client";
import { generateId } from "../game/utils";
import { Profile } from "./profile";

type SocketCallback = (...args: any[]) => void;
type CallbackDict = { [eventName: string]: SocketCallback };

type PossibleMove = {
    fromCell: HexMapCell,
    toCell: HexMapCell,
    hostileToCapture: number,
    ownToLoseInCounter: number,
    isJump: boolean
}

type PossibleMoveList = {
    all: PossibleMove[],
    near: PossibleMove[],
    far: PossibleMove[],
    maxCapture: PossibleMove | null,
    maxCaptureProfit: number,
    minLose: PossibleMove | null
    minLoseCount: number
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

        const chanceToCaptureJump = this.match.getTurn() < 10 ? 0.08 : 0.65;
        const chanceToEmojiOnBigCapture = 0.66;
        const chanceToEmojiOnCapture = 0.15;

        if (moves.far.length <= 2 && this.match.getTurn() >= 16) {
            return this.makeMove(this.getRandomArrayItem(moves.far));
        }

        if (moves.maxCapture && (moves.maxCaptureProfit > 1 || Math.random() <= chanceToCaptureJump)) {
            if (moves.maxCaptureProfit >= 5) {
                if (Math.random() <= chanceToEmojiOnBigCapture) this.sendEmoji('😎', 1500);
            } else if (moves.maxCaptureProfit >= 4) {
                if (Math.random() <= chanceToEmojiOnCapture) this.sendEmoji('😀', 1500);
            }
            return this.makeMove(moves.maxCapture);
        }

        if (moves.near.length > 0) return this.makeMove(this.getRandomArrayItem(moves.near));

        if (moves.maxCapture) return this.makeMove(moves.maxCapture);

        if (moves.minLose) return this.makeMove(moves.minLose);

        if (moves.far.length > 0) return this.makeMove(this.getRandomArrayItem(moves.far));

        return this.makeMove(this.getRandomArrayItem(moves.all));
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

    getPossibleMoves(): PossibleMoveList {
        const moves: PossibleMoveList = {
            all: [],
            far: [],
            near: [],
            maxCapture: null,
            maxCaptureProfit: 0,
            minLose: null,
            minLoseCount: 0
        }

        const levels: HexNeighborLevel[] = [
            HexNeighborLevel.Near,
            HexNeighborLevel.Far
        ];

        let maxCaptureProfit = 0;
        let minLose = 99999;

        const map = this.match.getMap();
        map.getCells().forEach(cell => {
            if (!cell.isOccupiedBy(this.getTag())) return;

            const emptyNeighbors = map.getCellEmptyNeighbors(cell.id);
            const hasNear = emptyNeighbors[HexNeighborLevel.Near].length > 0;
            const hasFar = emptyNeighbors[HexNeighborLevel.Far].length > 0;
            const hasMoves = hasNear || hasFar;
            if (!hasMoves) { return; }

            const ownToLoseInCounter = map.isCellCanBeAttacked(cell.id, this.getOpponent().getTag())
                ? map.getCellAllyNeighbors(cell.id, this.getTag()).length
                : 0;

            levels.forEach(level => {
                emptyNeighbors[level].forEach(emptyCellId => {
                    const emptyCell = map.getCell(emptyCellId);
                    const hostileToCapture = map.getCellHostileNeighbors(emptyCellId, this.getTag()).length;
                    const isJump = level === HexNeighborLevel.Far;

                    const move: PossibleMove = {
                        fromCell: cell,
                        toCell: emptyCell,
                        hostileToCapture,
                        ownToLoseInCounter: isJump ? ownToLoseInCounter : 0,
                        isJump,
                    };

                    moves.all.push(move);
                    move.isJump ? moves.far.push(move) : moves.near.push(move);

                    const loseCounter = move.isJump ? ownToLoseInCounter : 0;

                    if (hostileToCapture - move.ownToLoseInCounter > 0) {
                        const captureProfit = (hostileToCapture - move.ownToLoseInCounter) + (move.isJump && Math.random() > 0.1 ? 0 : 1);

                        if (captureProfit > 0 && captureProfit > maxCaptureProfit) {
                            maxCaptureProfit = captureProfit;
                            moves.maxCapture = move;
                        }
                    }

                    if (loseCounter > 0 && loseCounter < minLose) {
                        minLose = loseCounter;
                        moves.minLose = move;
                    }
                })
            })
        });

        moves.maxCaptureProfit = maxCaptureProfit;
        moves.minLoseCount = minLose;
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