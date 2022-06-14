"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const env = (name, defaultValue) => {
    defaultValue = defaultValue || false;
    return process.env[name] || defaultValue;
};
exports.Config = {
    sockets: {
        port: env('SERVER_WS_PORT', 3010),
        corsOrigin: env('SERVER_CORS_ORIGIN', 'localhost:3000'),
    },
    ssl: {
        certFile: env('SERVER_WS_CERT_FILE', '../docker/certs/server.crt'),
        keyFile: env('SERVER_WS_KEY_FILE', '../docker/certs/server.key')
    },
};
//# sourceMappingURL=config.js.map