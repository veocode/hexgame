const env = (name, defaultValue: any = false) => {
    return process.env[name] || defaultValue;
}

export const Config = {
    db: {
        url: env('MONGODB_URL', 'mongodb://hexgame:hexgamemongopassword@localhost:47017'),
        name: env('MONGODB_DATABASE', 'hexgame'),
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
        nickname: 'veo#admin',
    }
}