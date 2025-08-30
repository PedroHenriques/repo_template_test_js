#!/bin/sh
set -e;

: "${TEST_COVERAGE_DIR_PATH:=coverageReport}";
: "${TEST_COVERAGE_FILE_NAME:=lcov.info}";
: "${SONAR_QG_WAIT:=true}"
: "${SONAR_QG_TIMEOUT_SEC:=600}"

USE_DOCKER=0;
RUNNING_IN_PIPELINE=0;

while [ "$#" -gt 0 ]; do
  case "$1" in
    --docker) USE_DOCKER=1; shift 1;;
    --cicd) RUNNING_IN_PIPELINE=1; USE_DOCKER=1; shift 1;;

    -*) echo "unknown option: $1" >&2; exit 1;;
  esac
done

rm -rf .sonarqube;

if [ ! -f "${TEST_COVERAGE_DIR_PATH}/${TEST_COVERAGE_FILE_NAME}" ]; then
  echo "Coverage not found at ${TEST_COVERAGE_DIR_PATH}/${TEST_COVERAGE_FILE_NAME} — generating…";
  
  FLAGS="";
  if [ $RUNNING_IN_PIPELINE -eq 1 ]; then
    FLAGS="--cicd";
  elif [ $USE_DOCKER -eq 1 ]; then
    FLAGS="--docker";
  fi
  
  TEST_COVERAGE_DIR_PATH="${TEST_COVERAGE_DIR_PATH}" TEST_COVERAGE_FILE_NAME="${TEST_COVERAGE_FILE_NAME}" sh cli/coverage.sh ${FLAGS};
fi

EXTRA_OPTS=""
if [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ]; then
  EXTRA_OPTS="$EXTRA_OPTS -Dsonar.pullrequest.key=${GITHUB_REF_NAME#refs/pull/} -Dsonar.pullrequest.branch=${GITHUB_HEAD_REF} -Dsonar.pullrequest.base=${GITHUB_BASE_REF}";
else
  EXTRA_OPTS="$EXTRA_OPTS -Dsonar.branch.name=${GITHUB_REF_NAME}";
fi

CMD="sonar-scanner -Dsonar.qualitygate.wait=${SONAR_QG_WAIT} -Dsonar.qualitygate.timeout=${SONAR_QG_TIMEOUT_SEC} ${EXTRA_OPTS} -Dsonar.projectBaseDir=/app";

if [ $USE_DOCKER -eq 1 ]; then
  INTERACTIVE_FLAGS="-it";
  if [ $RUNNING_IN_PIPELINE -eq 1 ]; then
    INTERACTIVE_FLAGS="-i";
  fi

  docker network create myapp_shared || true;
  docker run --rm ${INTERACTIVE_FLAGS} -v "./:/app/" -w "/app/" -e TEST_COVERAGE_DIR_PATH -e TEST_COVERAGE_FILE_NAME -e EXTERNAL_STATIC_ANALYSIS_PROJ_KEY -e EXTERNAL_STATIC_ANALYSIS_ORG -e EXTERNAL_STATIC_ANALYSIS_HOST -e SONAR_TOKEN="${EXTERNAL_STATIC_ANALYSIS_TOKEN}" -e SONAR_SCANNER_OPTS="-Dsonar.working.directory=/tmp/.scannerwork" sonarsource/sonar-scanner-cli:latest /bin/sh -c "${CMD}";
else
  export TEST_COVERAGE_DIR_PATH TEST_COVERAGE_FILE_NAME;
  eval "${CMD}";
fi