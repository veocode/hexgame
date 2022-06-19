# hexgame

React/TypeScript Multiplayer Hexxagon-clone Game

### Local Development

```bash
# Installation
git clone git@github.com:veocode/hexgame.git
cd hexgame
./deploy.sh dev --build

# Up (listens at localhost:3000)
./deploy.sh dev

# Building
./deploy.sh build        # build src to dist
./deploy.sh build-push   # build + push to git
./deploy.sh build-deploy # build-push + deploy to prod
```

### Production

```bash
# Installation
git clone git@github.com:veocode/hexgame.git
cd hexgame
./deploy.sh build-docker

# Up
./deploy.sh up

# Down
./deploy.sh down
```