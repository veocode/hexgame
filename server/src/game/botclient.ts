import { HexNeighborLevel } from "../shared/hexmap";
import { HexMapCell } from "../shared/hexmapcell";
import { Client } from "./client";

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
    'h3xk1ll3r',
    'hexmaniac',
    'hellohex',
    'hexcake',
    'xehhex',
    'whatahex',
];

export class BotClient extends Client {

    private botId: string = '';
    private botNickname: string = '';

    private callbacks: CallbackDict = {};

    isBot(): boolean {
        return true;
    }

    getId(): string {
        if (this.botId) return this.botId;
        return this.botId = this.generateId();
    }

    getNickname(): string {
        if (this.botNickname) return this.botNickname;
        return this.botNickname = this.shuffleArray(botNames)[0];
    }

    private generateId(length: number = 6): string {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    on(eventName: string, callback: SocketCallback) {
        this.callbacks[eventName] = callback;
    }

    off(eventName: string) {
        delete this.callbacks[eventName];
    }

    send(eventName, data: any) {
        if (eventName === 'game:match:move-request') {
            this.onMatchMoveRequest();
        }
    }

    private onMatchMoveRequest() {
        const moves = this.getPossibleMoves();

        if (moves.maxCapture) return this.makeMove(moves.maxCapture);

        if (moves.near.length > 0) return this.makeMove(this.shuffleArray(moves.near)[0]);

        if (moves.minLose) return this.makeMove(moves.minLose);

        if (moves.far.length > 0) return this.makeMove(this.shuffleArray(moves.far)[0]);

        return this.makeMove(this.shuffleArray(moves.all)[0]);
    }

    private callback(eventName: string, data: any) {
        if (eventName in this.callbacks) {
            this.callbacks[eventName](data);
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

            if (hasMoves) {
                const ownToLoseInCounter = map.isCellCanBeAttacked(cell.id, this.getOpponent().getTag())
                    ? map.getCellAllyNeighbors(cell.id, this.getTag()).length
                    : 0;

                levels.forEach(level => {
                    emptyNeighbors[level].forEach(emptyCellId => {
                        const emptyCell = map.getCell(emptyCellId);
                        const hostileToCapture = map.getCellHostileNeighbors(emptyCellId, this.getTag()).length;

                        const move: PossibleMove = {
                            fromCell: cell,
                            toCell: emptyCell,
                            hostileToCapture,
                            ownToLoseInCounter,
                            isJump: level === HexNeighborLevel.Far,
                        };

                        moves.all.push(move);
                        move.isJump ? moves.far.push(move) : moves.near.push(move);

                        const loseCounter = move.isJump ? ownToLoseInCounter : 0;
                        const captureProfit = (hostileToCapture - loseCounter) + (move.isJump ? 0 : 1);

                        if (captureProfit > 0 && captureProfit > maxCaptureProfit) {
                            maxCaptureProfit = captureProfit;
                            moves.maxCapture = move;
                        }

                        if (loseCounter > 0 && loseCounter < minLose) {
                            minLose = loseCounter;
                            moves.minLose = move;
                        }
                    })
                })
            }
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

}