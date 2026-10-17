#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="mongo-express-test-mongodb"

if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  docker stop "$CONTAINER_NAME"
  docker rm "$CONTAINER_NAME"
else
  echo "MongoDB test container '$CONTAINER_NAME' is not running or does not exist."
fi
