const env = (name, defaultValue: any = false) => {
    return process.env[name] || defaultValue;
}

const isDev = env('APP_ENV', 'dev') === 'dev';

const defaultMongo = {
    host: isDev ? 'localhost' : 'mongodb',
    port: 47017,
    user: 'hexgame:hexgamemongopassword',
    database: 'hexgame'
};

export const Config = {
    host: env('SERVER_HOST', isDev ? 'http://localhost:3000' : 'https://playhex.online'),
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
}