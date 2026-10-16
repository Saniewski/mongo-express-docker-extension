# Mongo Express Docker Extension

Run Mongo Express in Docker Desktop and connect to any MongoDB server.

Mongo Express Docker Extension allows you to connect to any (local or remote) MongoDB server
without having to install Mongo Express locally or manually create a Mongo Express Docker container.

## Features

- Save and manage multiple MongoDB connections from the extension home page.
- Connect using a hostname and optional credentials or a MongoDB connection string.
- Start a Mongo Express container by opening a connection.
- Remove the container by closing the connection and returning to the connections page. Containers left behind by an interrupted session are cleaned up the next time the home page opens.
- Scope cleanup to containers labeled as belonging to this extension.

## Installation

Install the extension from the Docker Desktop marketplace:

https://open.docker.com/extensions/marketplace?extensionId=saniewski/mongo-express-docker-extension&tag=1.0.2

Or install it manually:

```bash
docker extension install saniewski/mongo-express-docker-extension:1.0.2
```

## Usage

Use **Add connection** on the home page to save a connection. The **Host and credentials** option accepts a MongoDB hostname, port, and optional username/password. The **Connection string** option accepts a MongoDB URI. Select **Open** to start Mongo Express for that connection; returning to the connections page stops and removes its container.

For a MongoDB server running on the Docker Desktop host, use `host.docker.internal` or `localhost` as the host. `localhost` is translated to `host.docker.internal` for the Mongo Express container. For another MongoDB container, use its container name and ensure it shares a Docker network with the extension-managed Mongo Express container; the extension automatically joins a matching local MongoDB container's network when possible.

Saved connection details, including credentials, are stored in the Docker Desktop extension's browser `localStorage`. They are not sent anywhere by the extension. Remove saved connections you no longer need, and avoid saving secrets on a shared desktop account.

## Development

```bash
pnpm install
pnpm dev
pnpm build
```

Build and install the Docker Desktop extension with `make install-extension`.
