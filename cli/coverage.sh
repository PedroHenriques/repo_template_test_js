#!/bin/sh
set -e;

: "${TEST_COVERAGE_DIR_PATH:=coverageReport}";
: "${TEST_COVERAGE_FILE_NAME:=lcov.info}";

USE_DOCKER=0;
RUNNING_IN_PIPELINE=0;
DOCKER_FLAG="";
CICD_FLAG="";

while [ "$#" -gt 0 ]; do
  case "$1" in
    --docker) USE_DOCKER=1; shift 1;;
    --cicd) RUNNING_IN_PIPELINE=1; USE_DOCKER=1; shift 1;;

    -*) echo "unknown option: $1" >&2; exit 1;;
  esac
done

if [ $USE_DOCKER -eq 1 ]; then
  DOCKER_FLAG="--docker";
fi
if [ $RUNNING_IN_PIPELINE -eq 1 ]; then
  CICD_FLAG="--cicd";
fi

if [ $USE_DOCKER -eq 0 ]; then
  rm -rf ./${TEST_COVERAGE_DIR_PATH};
fi

find . -type d -name "${TEST_COVERAGE_DIR_PATH}" -exec rm -rf {} +;

CMD="npm ci && C8_REPORT_DIR='${TEST_COVERAGE_DIR_PATH}' npm run test:coverage -- \"./test/unit/**/*.@(test|spec).js\""

if [ $USE_DOCKER -eq 1 ]; then
  INTERACTIVE_FLAGS="-it";
  if [ $RUNNING_IN_PIPELINE -eq 1 ]; then
    INTERACTIVE_FLAGS="-i";
  fi

  docker network create myapp_shared || true;
  docker run --rm ${INTERACTIVE_FLAGS} -v "./:/app/" -w "/app/" node:24-bullseye-slim /bin/sh -c "${CMD}";
else
  eval "${CMD}";
fi
