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
exports.ProfileModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    sourceId: { type: String, required: true },
    nickname: { type: String, default: 'unnamed' },
    name: { type: String, default: 'unnamed' },
    avatarUrl: { type: String },
    cityId: { type: Number, default: 0 },
    countryId: { type: Number, default: 0 },
    score: {
        total: { type: Number, default: 0 },
        today: { type: Number, default: 0 },
        week: { type: Number, default: 0 },
        month: { type: Number, default: 0 },
    },
    createdAt: { type: Date, default: Date.now },
    visitedAt: { type: Date, default: Date.now }
});
schema.statics.getBySourceId = function (sourceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield exports.ProfileModel.findOne({ sourceId }).exec();
        return result;
    });
};
schema.statics.getOrCreateByAuthInfo = function (authInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        let profile = yield this.getBySourceId(authInfo.sourceId);
        if (profile !== null)
            return profile;
        profile = new this(Object.assign({}, authInfo));
        yield profile.save();
        return profile;
    });
};
schema.statics.getTopPlayers = function (period, count) {
    return __awaiter(this, void 0, void 0, function* () {
        const sortDict = {};
        sortDict[`score.${period}`] = -1;
        return yield exports.ProfileModel.find({ sourceId: { $ne: 'bot' } }).sort(sortDict).limit(count).exec();
    });
};
schema.methods.getFullName = function () {
    return this.firstName + ' ' + this.lastName;
};
schema.methods.updateVisitedAt = function () {
    return __awaiter(this, void 0, void 0, function* () {
        this.visitedAt = new Date();
        yield this.save();
    });
};
schema.methods.addScore = function (points) {
    return __awaiter(this, void 0, void 0, function* () {
        this.score.total = Math.max(this.score.total + points, 0);
        this.score.today = Math.max(this.score.today + points, 0);
        this.score.week = Math.max(this.score.week + points, 0);
        this.score.month = Math.max(this.score.month + points, 0);
        yield this.save();
    });
};
exports.ProfileModel = (0, mongoose_1.model)('ProfileModel', schema);
//# sourceMappingURL=profilemodel.js.map