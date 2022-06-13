export enum PlayerHasNoMovesReasons {
    Left = 'left',
    Eliminated = 'eliminated',
    NoMoves = 'no-moves'
}

export enum PlayerTag {
    Player1 = 1,
    Player2 = 2,
}

export type PlayerColorsList = { [key: number]: string }

export class Player {

    private tag: number = 0;

    getTag(): number {
        return this.tag;
    }

    setTag(tag: number) {
        this.tag = tag;
    }

    getOpponentTag() {
        return this.getTag() === PlayerTag.Player1
            ? PlayerTag.Player2
            : PlayerTag.Player1;
    }

}