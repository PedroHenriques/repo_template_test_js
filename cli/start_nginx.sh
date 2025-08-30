#!/bin/sh
set -e;

docker network create myapp_shared || true;

docker compose -f setup/local/docker-compose.nginx.yml -p myapp_nginx up --no-build $@;