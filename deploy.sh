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

install() {
    echo "Installing root dependencies..."
    npm install
    echo "Installing client dependencies..."
    cd client && npm install
    echo "Installing server dependencies..."
    cd ../server && npm install
    echo "Done!"
}

update() {
    down
    git pull
    build
    up
}

up(){
    docker-compose up -d $ARGS
}

down(){
    docker-compose down --remove-orphans && docker network prune -f
}

restart(){
    down
    up
    log
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
    up --build
    log
}

COMMAND=${1:-"help"}
shift
ARGS=$@

"$COMMAND" "$@"
exit 0