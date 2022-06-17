"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = exports.PlayerTag = exports.PlayerHasNoMovesReasons = void 0;
var PlayerHasNoMovesReasons;
(function (PlayerHasNoMovesReasons) {
    PlayerHasNoMovesReasons["Left"] = "left";
    PlayerHasNoMovesReasons["Eliminated"] = "eliminated";
    PlayerHasNoMovesReasons["NoMoves"] = "no-moves";
})(PlayerHasNoMovesReasons = exports.PlayerHasNoMovesReasons || (exports.PlayerHasNoMovesReasons = {}));
var PlayerTag;
(function (PlayerTag) {
    PlayerTag[PlayerTag["Player1"] = 1] = "Player1";
    PlayerTag[PlayerTag["Player2"] = 2] = "Player2";
})(PlayerTag = exports.PlayerTag || (exports.PlayerTag = {}));
class Player {
    constructor() {
        this.tag = 0;
    }
    getTag() {
        return this.tag;
    }
    setTag(tag) {
        this.tag = tag;
    }
    getOpponentTag() {
        return this.getTag() === PlayerTag.Player1
            ? PlayerTag.Player2
            : PlayerTag.Player1;
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map