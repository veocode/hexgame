export type PlayerAuthInfo = {
    sourceId: string | null,
    lang: string,
    nickname: string,
    name?: string,
    avatarUrl?: string,
    cityId?: number,
    countryId?: number,
}

export class Player {

    protected tag: number = 0;
    protected isAdministrator: boolean = false;

    constructor(
        public readonly authInfo: PlayerAuthInfo,
        protected isGuestPlayer: boolean = false
    ) { }

    isGuest(): boolean {
        return this.isGuestPlayer;
    }

    isAdmin(): boolean {
        return this.isAdministrator;
    }

    setAdmin() {
        this.isAdministrator = true;
    }

}