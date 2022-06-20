import { Game } from "./game";
import { Match, MatchServerScoreDict } from "./match";

export interface SpectateMatchOptions {
    map: number[],
    initialScores: MatchServerScoreDict,
    maxTurnTime: number
}

export class SpectateMatch extends Match {

    constructor(game: Game, opts: SpectateMatchOptions) {
        super(game, {
            playerTag: 0,
            ...opts
        })
    }

}