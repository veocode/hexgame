"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    date() {
        return (new Date()).toLocaleString();
    }
    log(...args) {
        console.log(`[${this.date()}] `, ...args);
    }
    error(...args) {
        console.error(`[${this.date()}] [ERROR] `, ...args);
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map