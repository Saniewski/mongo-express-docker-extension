#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="mongo-express-test-mongodb"

# Connection string: mongodb://testuser:testpassword@localhost:27017/?authSource=admin
if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  docker start "$CONTAINER_NAME"
else
  docker run --detach \
    --name "$CONTAINER_NAME" \
    --publish 27017:27017 \
    --env MONGO_INITDB_ROOT_USERNAME=testuser \
    --env MONGO_INITDB_ROOT_PASSWORD=testpassword \
    --volume mongo-express-test-mongodb-data:/data/db \
    mongo:9
fi
