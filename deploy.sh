#!/bin/bash

set -eu
cd "$(dirname "$0")"

DEPLOY_HOST="playhex"
DEPLOY_PATH="/opt/hexgame"

if [[ ${1:-help} == help ]]; then
    echo ""
    echo "Usage:"
    echo "  deploy.sh [command]"
    echo ""
    echo "Commands: "
    echo "  Dev: "
    echo "      install"
    echo "      dev"
    echo "      build"
    echo "      build-push"
    echo "      build-deploy"
    echo ""
    echo "  Production: "
    echo "      update"
    echo "      build-docker"
    echo "      up"
    echo "      down"
    echo "      restart"
    echo "      check"
    echo "      log"
    echo "      logs [-f]"
    echo ""
    exit 1
fi

clear() {
    read -p "Are you sure? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        sudo rm -rf storage/mongodb/*
        sudo chown -R 1000:1000 storage/mongodb
    fi
}

install() {
    echo "Installing builder dependencies..."
    cd app/builder && npm install
    echo "Installing client dependencies..."
    cd ../client && npm install
    echo "Installing server dependencies..."
    cd ../server && npm install
    cd ..
    echo "Done!"
}

dev() {
    dev-down
    docker-compose -f docker-compose.dev.yml up -d $ARGS
    npm run dev --prefix=./app/builder
    dev-logs
}

dev-down() {
    docker-compose -f docker-compose.dev.yml down --remove-orphans && docker network prune -f
}

dev-logs() {
    docker-compose -f docker-compose.dev.yml logs $ARGS
}

up(){
    docker-compose -f docker-compose.prod.yml up -d
}

down(){
    docker-compose -f docker-compose.prod.yml down --remove-orphans && docker network prune -f
}

restart(){
    down
    up
    logs
}

build() {
    echo "Building project..."
    rm -rf ./dist/client/*
    rm -rf ./dist/server/*
    npm run build --prefix=./app/builder
}

build-push() {
    build
    git add .
    git commit -m 'built dist'
    git push
}

build-deploy() {
    echo "Building and deploying to: "
    echo "   Host: $DEPLOY_HOST"
    echo "   Path: $DEPLOY_PATH"
    echo ""
    build-push
    ssh $DEPLOY_HOST "$DEPLOY_PATH/deploy.sh update"
}

build-docker() {
    docker-compose -f docker-compose.prod.yml build
}

log() {
    docker-compose -f docker-compose.prod.yml logs -f --tail=50 server
}

logs() {
    docker-compose -f docker-compose.prod.yml logs $ARGS
}

check() {
    echo "========================== CONTAINERS STATE ========================================"
    docker-compose -f docker-compose.prod.yml ps
}

update() {
    down
    git pull
    up
    logs
    echo "Update Done!"
}

update-rebuild() {
    down
    git pull
    docker-compose -f docker-compose.prod.yml up -d --build
    logs
    echo "Update Done!"
}

COMMAND=${1:-"help"}
shift
ARGS=$@

"$COMMAND" "$@"
exit 0