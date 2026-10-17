FROM --platform=$BUILDPLATFORM node:24-alpine AS builder
WORKDIR /ui
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . /ui
RUN pnpm run build

FROM scratch

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

COPY metadata.json mongo-express-logo.svg ./
COPY --from=builder /ui/build /ui
