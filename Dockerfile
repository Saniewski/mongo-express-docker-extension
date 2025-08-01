FROM golang:1.24-alpine AS builder
ENV CGO_ENABLED=0
WORKDIR /backend
COPY backend/go.* .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download
COPY backend/. .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -ldflags="-s -w" -o bin/service

FROM --platform=$BUILDPLATFORM node:24-alpine AS client-base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY ui /ui
WORKDIR /ui

FROM client-base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM client-base AS client-builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM alpine

ARG ADDITIONAL_URLS
ARG CHANGELOG
ARG DETAILED_DESCRIPTION
ARG SCREENSHOTS

LABEL \
    org.opencontainers.image.title="Mongo Express" \
    org.opencontainers.image.description="Run Mongo Express in Docker Desktop and connect to any MongoDB server." \
    org.opencontainers.image.vendor="Pawel Saniewski" \
    com.docker.desktop.extension.api.version="0.3.0" \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/Saniewski/mongo-express-docker-extension/main/favicon.ico" \
    com.docker.extension.additional-urls=$ADDITIONAL_URLS \
    com.docker.extension.changelog=$CHANGELOG \
    com.docker.extension.detailed-description=$DETAILED_DESCRIPTION \
    com.docker.extension.screenshots=$SCREENSHOTS \
    com.docker.extension.categories="database,utility-tools" \
    com.docker.extension.publisher-url="https://github.com/Saniewski/mongo-express-docker-extension"

COPY --from=builder /backend/bin/service /
COPY \
    docker-compose.yaml \
    metadata.json \
    mongo-express-logo.svg \
    extension-config.yaml \
    ./

COPY --from=prod-deps /ui/node_modules /ui/node_modules
COPY --from=client-builder /ui/build /ui
CMD /service -socket /run/guest-services/mongo-express-docker-extension.sock
