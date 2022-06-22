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
exports.User = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    externalId: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    avatarUrl: { type: String },
    rating: { type: Number },
    createdAt: { type: Date, default: Date.now },
    visitedAt: { type: Date, default: Date.now }
});
schema.static('getByExternalId', function getByExternalId(externalId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield exports.User.findOne({ externalId }).exec();
    });
});
schema.static('getOrCreateByExternalId', function getOrCreateByExternalId(externalId) {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield this.getByExternalId(externalId);
        if (user)
            return user;
        user = new this({
            externalId
        });
        yield user.save();
        return user;
    });
});
schema.method('getFullName', function getFullName() {
    return this.firstName + ' ' + this.lastName;
});
exports.User = (0, mongoose_1.model)('User', schema);
//# sourceMappingURL=user.js.map