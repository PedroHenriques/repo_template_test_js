#!/bin/bash
set -euo pipefail;

: "${BASE_URL:=/}";
: "${SRC_DIR:=src}";

USE_DOCKER=0;
RUNNING_IN_PIPELINE=0;
BASE_PER_SERVICE=0;
SERVICES=();

while [ "$#" -gt 0 ]; do
  case "$1" in
    --docker) USE_DOCKER=1; shift ;;
    --cicd) RUNNING_IN_PIPELINE=1; USE_DOCKER=1; shift ;;
    --base-per-service) BASE_PER_SERVICE=1; shift ;;

    -*) echo "unknown option: $1" >&2; exit 1 ;;
    *) SERVICES+=("$1"); shift ;;
  esac
done

if [ $USE_DOCKER -eq 1 ]; then
  # Forward only safe args (no --docker/--cicd to avoid recursion)
  FORWARD_ARGS=();
  if [ $BASE_PER_SERVICE -eq 1 ]; then
    FORWARD_ARGS+=("--base-per-service");
  fi
  if ((${#SERVICES[@]})); then
    FORWARD_ARGS+=("${SERVICES[@]}");
  fi

  # Properly escape args for the shell in the container
  ARG_STR="$(printf '%q ' "${FORWARD_ARGS[@]}")";

  INTERACTIVE_FLAGS="-it";
  if [ $RUNNING_IN_PIPELINE -eq 1 ]; then
    INTERACTIVE_FLAGS="-i";
  fi

  docker network create myapp_shared || true;
  docker run --rm ${INTERACTIVE_FLAGS} --network=myapp_shared -v "./:/app/" -w "/app/" -e BASE_URL -e SRC_DIR node:24-bullseye-slim /bin/bash -lc "if [ ! -d node_modules ]; then npm ci; fi && chmod +x ./cli/build_dist.sh && ./cli/build_dist.sh ${ARG_STR}";
else
  if ((${#SERVICES[@]}==0)); then
    mapfile -t SERVICES < <(find "${SRC_DIR}" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort);
  fi

  for service in "${SERVICES[@]}"; do
    echo "▶ Building: ${service}";

    if [ $BASE_PER_SERVICE -eq 1 ]; then
      export BASE_URL="/${service}/";
    else
      export BASE_URL="${BASE_URL}";
    fi

    export SERVICE="${service}";

    rm -rf "./dist/${service}";

    npm run build:prod;
  done
fi

