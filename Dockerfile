FROM golang:1.19-alpine AS builder
ENV CGO_ENABLED=0
WORKDIR /backend
COPY vm/go.* .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download
COPY vm/. .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -ldflags="-s -w" -o bin/service

FROM --platform=$BUILDPLATFORM node:18.9-alpine3.15 AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci
# install
COPY ui /ui
RUN npm run build

FROM alpine
LABEL org.opencontainers.image.title="Mongo Express Docker Extension" \
    org.opencontainers.image.description="Run Mongo Express in Docker Desktop and connect to any MongoDB server." \
    org.opencontainers.image.vendor="Pawel Saniewski" \
    com.docker.desktop.extension.api.version="0.3.0" \
    com.docker.extension.categories="database,utility-tools" \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/favicon.ico" \
    com.docker.extension.screenshots="[\
        {\"alt\":\"Login Page - Basic 1\", \"url\":\"https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/01-login-page-basic-1.png\"},\
        {\"alt\":\"Login Page - Basic 2\", \"url\":\"https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/02-login-page-basic-2.png\"},\
        {\"alt\":\"Login Page - Connection String\", \"url\":\"https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/03-login-page-connection-string.png\"},\
        {\"alt\":\"Loading Mongo Express\", \"url\":\"https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/04-loading-mongo-express.png\"},\
        {\"alt\":\"Mongo Express Dashboard\", \"url\":\"https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/05-mongo-express-dashboard.png\"},\
        {\"alt\":\"Service Unavailable\", \"url\":\"https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/docs/screenshots/06-service-unavailable.png\"},\
        ]" \
    com.docker.extension.additional-urls="[\
        {\"title\":\"Documentation\",\"url\":\"https://github.com/Saniewski/mongo-express-docker-extension/blob/main/README.md\"},\
        {\"title\":\"Changelog\",\"url\":\"https://github.com/Saniewski/mongo-express-docker-extension/releases\"},\
        {\"title\":\"License\",\"url\":\"https://github.com/Saniewski/mongo-express-docker-extension/blob/main/LICENSE\"},\
        ]" \
    com.docker.extension.publisher-url="https://github.com/Saniewski/mongo-express-docker-extension" \
    com.docker.extension.changelog="<p>Visit <a href=\"https://github.com/Saniewski/mongo-express-docker-extension/releases\">the releases page</a> to see the full changelog.</p>" \
    com.docker.extension.detailed-description="\
    <p>Run Mongo Express in Docker Desktop and connect to any MongoDB server.</p>\
    <p>Mongo Express Docker Extension allows you to connect to any (local or remote) MongoDB server without having to install Mongo Express locally or manually create a Mongo Express Docker container.</p>\
    <h3>Features</h3>\
    <ul>\
    <li>Run Mongo Express in Docker Desktop.</li>\
    <li>Specify the MongoDB server to connect to.</li>\
    <li>Save credentials for future use.</li>\
    </ul>\
    <h3>Usage</h3>\
    <p>To connect to a MongoDB server, you can use the \"Basic\" authentication method by providing a hostname and a port of the MongoDB instance.\
    Specifying a username and password is optional, depending on the security of your MongoDB server.\
    Alternatively, you can use the \"Connection String\" authentication method by providing a valid MongoDB connection string.\
    For instructions on how to use MongoDB connection strings, please, refer to <a href=\"https://www.mongodb.com/docs/manual/reference/connection-string/\">the official MongoDB documentation</a>.</p>\
    "

COPY --from=builder /backend/bin/service /
COPY docker-compose.yaml .
COPY metadata.json .
COPY mongo-express-logo.svg .
COPY extension-config.yaml .
COPY --from=client-builder /ui/build ui
CMD /service -socket /run/guest-services/mongo-express-docker-extension.sock
