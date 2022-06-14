"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const env = (name, defaultValue) => {
    defaultValue = defaultValue || false;
    return process.env[name] || defaultValue;
};
exports.Config = {
    sockets: {
        port: env('SOCKET_PORT', 3010),
        corsOrigin: env('SOCKET_CORS_ORIGIN', '*'),
    },
};
//# sourceMappingURL=config.js.map