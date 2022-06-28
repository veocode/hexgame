"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.List = exports.generateId = void 0;
const crypto_1 = require("crypto");
function generateId() {
    return (0, crypto_1.randomBytes)(3 * 4).toString('base64');
}
exports.generateId = generateId;
class List {
    constructor() {
        this.items = {};
    }
    add(item) {
        this.items[item.id] = item;
    }
    remove(item) {
        if (item.id in this.items) {
            delete this.items[item.id];
            return true;
        }
        return false;
    }
    hasId(id) {
        return id in this.items;
    }
    includes(item) {
        return this.hasId(item.id);
    }
    getById(id) {
        return this.items[id];
    }
    count() {
        return Object.keys(this.items).length;
    }
    forEach(callback) {
        Object.values(this.items).forEach(item => {
            callback(item);
        });
    }
    forEachExcept(exceptItem, callback) {
        Object.values(this.items).forEach(item => {
            if (item.id === exceptItem.id)
                return;
            callback(item);
        });
    }
    toArray() {
        return Object.values(this.items);
    }
}
exports.List = List;
//# sourceMappingURL=utils.js.map