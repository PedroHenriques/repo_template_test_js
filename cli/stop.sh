#!/bin/sh
set -e;

docker compose -f setup/local/docker-compose.yml -p myapp down;
docker compose -f setup/local/docker-compose.nginx.yml -p myapp_nginx down;
docker system prune -f --volumes;