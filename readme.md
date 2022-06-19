# hexgame

React/TypeScript Multiplayer Hexxagon-clone Game

### Local Development

Requirements: node, npm, docker, docker-compose

```bash
# Installation
git clone git@github.com:veocode/hexgame.git
cd hexgame
cp .env.example .env
cp docker/certs/server.crt.example docker/certs/server.crt
cp docker/certs/server.key.example docker/certs/server.key
./deploy.sh install

# Up (npm run dev in both client and server)
./deploy.sh dev

# Building (npm run build in both client and server)
./deploy.sh build        # build src to dist
./deploy.sh build-push   # build + push to git
./deploy.sh build-deploy # build-push + deploy to prod
```

### Production

Requirements: docker, docker-compose

```bash
# Installation
git clone git@github.com:veocode/hexgame.git
cd hexgame
./deploy.sh build-docker

# Up
./deploy.sh up

# Down
./deploy.sh down

# Update from git amd restart
./deploy.sh update
```