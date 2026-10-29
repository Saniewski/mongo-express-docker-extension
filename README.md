# Mongo Express Docker Extension

Run Mongo Express in Docker Desktop and connect to any MongoDB server.

Mongo Express Docker Extension allows you to connect to any (local or remote) MongoDB server
without having to install Mongo Express locally or manually create a Mongo Express Docker container.

## Features

- Save and manage multiple MongoDB connections from the extension home page.
- Connect using a hostname and optional credentials or a MongoDB connection string.
- Configure TLS with a custom CA and client certificate/key PEM files.
- Limit Mongo Express to one database with database-scoped mode.
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

### Database-scoped mode

Enable **Database-scoped mode** for an account that should browse a single database. With **Host and credentials**, enter the **Database name**. With **Connection string**, include it in the URI, for example `mongodb://localhost:27017/app`.

This disables Mongo Express's admin features and prevents it from listing other databases. It does not change the account's read/write permissions. Host-and-credentials connections continue to authenticate against `admin`; use a URI with `authSource` if the account authenticates against another database. Existing connections keep admin mode until you enable database-scoped mode.

### TLS settings

Enable **TLS settings** to configure certificate authentication or a custom certificate authority:

- **CA certificate**: an optional PEM file containing the CA certificate(s). Leave it empty to use the Mongo Express container's trusted authorities.
- **Client certificate/key**: an optional PEM file containing both the client certificate and its matching private key. If your provider supplies separate files, combine them into a private PEM file on your computer first.
- **Allow certificate hostname mismatch**: off by default. Enable only for a trusted local proxy whose server certificate does not name the address used to reach it. CA verification remains enabled.

Use **Browse** or enter an absolute path on the Docker Desktop host. Docker Desktop must be able to access the files. The extension stores only their paths and mounts the selected files read-only into Mongo Express. Close and reopen the connection after renewing or replacing certificates.

Enabled TLS settings override the certificate paths and verification options in the URI. When disabled, no certificate files are mounted and TLS follows the URI, including the default TLS behavior of `mongodb+srv://`.

## Development

```bash
pnpm install
pnpm dev
pnpm build
```

Build and install the Docker Desktop extension with `make install-extension`.
