export type PlayerInfo = {
    lang: string,
    nickname: string,
    externalId: string | null
    avatarUrl?: string,
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