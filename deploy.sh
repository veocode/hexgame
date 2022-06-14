#!/bin/bash

set -eu
cd "$(dirname "$0")"

if [[ ${1:-help} == help ]]; then
    echo "Usage: up, down, restart, log, logs, check"
    exit 1
fi

build() {
    echo "Building project..."
    rm -rf ./dist/client/*
    rm -rf ./dist/server/*
    npm run build
}

build-push() {
    build
    git add .
    git commit -m 'built dist'
    git push
}

build-docker() {
    docker-compose build
}

install() {
    echo "Installing root dependencies..."
    npm install
    echo "Installing client dependencies..."
    cd client && npm install
    echo "Installing server dependencies..."
    cd ../server && npm install
    echo "Done!"
}

up(){
    docker-compose up -d
}

down(){
    docker-compose down --remove-orphans && docker network prune -f
}

restart(){
    down
    up
    logs
}

log() {
    docker-compose logs -f --tail=50 server
}

logs() {
    docker-compose logs $ARGS
}

check() {
    echo "========================== CONTAINERS STATE ========================================"
    docker-compose ps
}

update() {
    down
    git pull
    docker-compose up -d --build
    logs
    echo "Update Done!"
}

COMMAND=${1:-"help"}
shift
ARGS=$@

"$COMMAND" "$@"
exit 0