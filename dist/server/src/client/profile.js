"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const profilemodel_1 = require("./profilemodel");
class Profile {
    constructor(authInfo) {
        this.authInfo = authInfo;
        this.model = null;
        this.nickname = '';
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const model = yield this.getModelByAuthInfo(this.authInfo);
            this.nickname = this.authInfo.nickname;
            this.model = model;
            this.model.visitedAt = new Date();
            if (this.authInfo.sourceId !== 'bot') {
                this.model.nickname = this.authInfo.nickname;
                this.model.name = this.authInfo.name ? this.authInfo.name : this.authInfo.nickname;
            }
            this.model.save();
        });
    }
    reload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.model.reload();
        });
    }
    static createAndLoad(authInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = new Profile(authInfo);
            yield profile.load();
            return profile;
        });
    }
    getModelByAuthInfo(authInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield profilemodel_1.ProfileModel.getOrCreateByAuthInfo(authInfo);
        });
    }
    addScore(points) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.model.addScore(points);
        });
    }
    getScore() {
        return this.model ? this.model.score : {
            total: 0,
            today: 0
        };
    }
    getTotalScore() {
        return this.model.score.total || 0;
    }
}
exports.Profile = Profile;
//# sourceMappingURL=profile.js.map