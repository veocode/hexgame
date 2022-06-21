export enum PlayerHasNoMovesReasons {
    Left = 'left',
    Eliminated = 'eliminated',
    NoMoves = 'no-moves'
}

export type PlayerColorsList = { [key: number]: string }

export type PlayerInfo = {
    lang: string,
    nickname: string,
    avatarUrl?: string,
    externalId?: string
}

export class Player {

    protected tag: number = 0;
    protected isAdministrator: boolean = false;

    constructor(public readonly info: PlayerInfo) { }

    isGuest(): boolean {
        return !this.info.externalId;
    }

    isAdmin(): boolean {
        return this.isAdministrator;
    }

    setAdmin() {
        this.isAdministrator = true;
    }

}