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
    score: {
        total: { type: Number, default: 0 },
        day: { type: Number, default: 0 },
        week: { type: Number, default: 0 },
        month: { type: Number, default: 0 },
    },
    createdAt: { type: Date, default: Date.now },
    visitedAt: { type: Date, default: Date.now }
});
schema.statics.getBySourceId = function (sourceId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield exports.ProfileModel.findOne({ sourceId }).exec();
    });
};
schema.statics.getOrCreateByAuthInfo = function (authInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        let profile = yield this.getBySourceId(authInfo.sourceId);
        if (profile)
            return profile;
        profile = new this(Object.assign({}, authInfo));
        yield profile.save();
        return profile;
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
exports.ProfileModel = (0, mongoose_1.model)('ProfileModel', schema);
//# sourceMappingURL=profilemodel.js.map