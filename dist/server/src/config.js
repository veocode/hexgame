"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const env = (name, defaultValue = false) => {
    return process.env[name] || defaultValue;
};
const isDev = env('APP_ENV', 'dev') === 'dev';
const defaultMongo = {
    host: isDev ? 'localhost' : 'mongodb',
    port: 47017,
    user: 'hexgame:hexgamemongopassword',
    database: 'hexgame'
};
exports.Config = {
    db: {
        url: env('SERVER_MONGODB_URL', `mongodb://${defaultMongo.user}@${defaultMongo.host}:${defaultMongo.port}`),
        name: env('SERVER_MONGODB_DATABASE', defaultMongo.database),
    },
    sockets: {
        port: env('SERVER_WS_PORT', 3010),
        corsOrigin: env('SERVER_CORS_ORIGIN', 'localhost:3000'),
    },
    ssl: {
        certFile: env('SERVER_WS_CERT_FILE', '../../docker/certs/server.crt'),
        keyFile: env('SERVER_WS_KEY_FILE', '../../docker/certs/server.key')
    },
    admin: {
        nickname: env('SERVER_ADMIN_NICKNAME', 'veo#admin'),
    }
};
//# sourceMappingURL=config.js.map