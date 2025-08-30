#!/bin/sh
set -e;

USE_DOCKER=0;
RUNNING_IN_PIPELINE=0;

while [ "$#" -gt 0 ]; do
  case "$1" in
    --docker) USE_DOCKER=1; shift 1;;
    --cicd) RUNNING_IN_PIPELINE=1; USE_DOCKER=1; shift 1;;

    -*) echo "unknown option: $1" >&2; exit 1;;
  esac
done

CMD="npm ci && npm run lint";

if [ $USE_DOCKER -eq 1 ]; then
  INTERACTIVE_FLAGS="-it";
  if [ $RUNNING_IN_PIPELINE -eq 1 ]; then
    INTERACTIVE_FLAGS="-i";
  fi

  docker network create myapp_shared || true;
  docker run --rm ${INTERACTIVE_FLAGS} --network=myapp_shared -v "./:/app/" -w "/app/" node:24-bullseye-slim /bin/sh -c "${CMD}";
else
  eval "${CMD}";
fi