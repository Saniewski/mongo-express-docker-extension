import { dockerExec } from "./dockerCli";
import { getErrorMessage } from "./errors";
import { MongoConnection } from "../types/MongoConnection";
import { buildMongoConfig } from "./mongoConfig";
import {
  CONNECTION_TEST_SCRIPT,
  CONNECTION_TEST_SUCCESSFUL_MESSAGE,
  HTTP_CHECK_SCRIPT,
  HTTP_SUCCESSFUL_MESSAGE,
} from "./mongoScripts";

const MONGO_EXPRESS_IMAGE = "mongo-express:latest";
const MONGO_EXPRESS_PORT = 8081;
const OWNER_LABEL = "com.saniewski.mongo-express-docker-extension";
const CONNECTION_LABEL = `${OWNER_LABEL}.connection-id`;
const CONNECTION_SUCCESSFUL_MESSAGE = "Mongo Express server listening";

/** Checks the selected mode's MongoDB permissions without saving the connection or writing data. */
export async function testMongoConnection(
  connection: Omit<MongoConnection, "id" | "name">,
): Promise<void> {
  const config = buildMongoConfig(connection);
  const target = await resolveMongoTarget(config.url);
  const containerName = `dd-ext-mongo-express-test-${crypto.randomUUID()}`;
  const args = [
    "run",
    "--rm",
    "--name",
    containerName,
    "--label",
    `${OWNER_LABEL}=true`,
    "--entrypoint",
    "node",
    "-e",
    `ME_CONFIG_MONGODB_URL=${target.url}`,
    "-e",
    `ME_CONFIG_MONGODB_ENABLE_ADMIN=${!connection.databaseScoped}`,
    "-e",
    `ME_CONFIG_MONGODB_SSL=${config.tls}`,
  ];
  for (const mount of config.mounts) args.push("--mount", mount);
  if (target.network) args.push("--network", target.network);
  args.push(MONGO_EXPRESS_IMAGE, "-e", CONNECTION_TEST_SCRIPT);

  try {
    const result = await runDocker(args);
    // SDK responses may omit the exit code; require confirmation from the database check.
    if (!result.stdout.split(/\r?\n/).includes(CONNECTION_TEST_SUCCESSFUL_MESSAGE)) {
      throw new Error(getErrorMessage(result, "The connection test ended without a result."));
    }
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(getMongoStartupError(message) ?? message, { cause: error });
  } finally {
    // Also remove containers left behind if Docker failed before the process could start.
    await removeContainer(containerName).catch((error: unknown) => {
      console.error("Failed to remove connection test container", getErrorMessage(error));
    });
  }
}

/**
 * Starts an isolated Mongo Express container for a connection and returns its host port.
 * Containers are created lazily, only when the user opens a saved connection.
 */
export async function startMongoExpress(
  connection: MongoConnection,
  launchId: string,
): Promise<number> {
  const config = buildMongoConfig(connection);
  const containerName = getContainerName(connection.id, launchId);
  await removeContainer(containerName);

  const target = await resolveMongoTarget(config.url);
  const args = [
    "run",
    "-d",
    "--name",
    containerName,
    "--label",
    `${OWNER_LABEL}=true`,
    "--label",
    `${CONNECTION_LABEL}=${connection.id}`,
    "-p",
    `127.0.0.1::${MONGO_EXPRESS_PORT}`,
    "-e",
    `ME_CONFIG_MONGODB_URL=${target.url}`,
    "-e",
    `ME_CONFIG_MONGODB_ENABLE_ADMIN=${!connection.databaseScoped}`,
    "-e",
    `ME_CONFIG_MONGODB_SSL=${config.tls}`,
    // The UI is published only on loopback and opened inside Docker Desktop.
    "-e",
    "ME_CONFIG_BASICAUTH=false",
  ];

  for (const mount of config.mounts) args.push("--mount", mount);
  if (target.network) args.push("--network", target.network);
  args.push(MONGO_EXPRESS_IMAGE);

  await runDocker(args);

  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await dockerExec("port", [containerName, `${MONGO_EXPRESS_PORT}/tcp`]);
      // Successful Docker Desktop SDK responses may omit the exit code.
      if (result.code === undefined || result.code === 0) {
        const port = result.stdout?.match(/:(\d+)\s*$/m)?.[1];
        if (port) return Number(port);
      }
      await wait(250);
    }
    throw new Error("Docker did not assign a host port to Mongo Express.");
  } catch (error) {
    await removeContainer(containerName).catch((cleanupError: unknown) => {
      console.error("Failed to remove Mongo Express container", getErrorMessage(cleanupError));
    });
    throw error;
  }
}

/** Returns up, exited, or null while the container is absent or still starting. */
export async function checkMongoExpress(
  connectionId: string,
  launchId: string,
): Promise<"up" | "exited" | null> {
  const containerName = getContainerName(connectionId, launchId);
  const inspect = await dockerExec("inspect", ["--format={{.State.Status}}", containerName]);
  if (inspect.code !== undefined && inspect.code !== 0) return null;

  const status = inspect.stdout?.trim().toLowerCase();
  if (status === "exited" || status === "dead") {
    const logs = await dockerExec("logs", ["--tail", "100", containerName]);
    const startupError = getMongoStartupError(`${logs.stdout}\n${logs.stderr}`);
    if (startupError) throw new Error(startupError);
    return "exited";
  }
  if (status !== "running") return null;

  const logs = await dockerExec("logs", ["--tail", "100", containerName]);
  const output = `${logs.stdout}\n${logs.stderr}`;
  if (!output.includes(CONNECTION_SUCCESSFUL_MESSAGE)) return null;

  const response = await dockerExec("exec", [containerName, "node", "-e", HTTP_CHECK_SCRIPT]);
  if (
    (response.code === undefined || response.code === 0) &&
    response.stdout.split(/\r?\n/).includes(HTTP_SUCCESSFUL_MESSAGE)
  ) {
    return "up";
  }

  // Some Mongo Express routes log MongoDB failures but leave the HTTP request unanswered.
  // Read logs after the request to show the cause before the failed container is removed.
  const failedLogs = await dockerExec("logs", ["--tail", "100", containerName]);
  throw new Error(
    getMongoStartupError(`${failedLogs.stdout}\n${failedLogs.stderr}`) ??
      getErrorMessage(response, "Mongo Express could not load its home page."),
  );
}

/** Stops and removes the Mongo Express container owned by a saved connection. */
export async function removeMongoExpress(connectionId: string, launchId?: string): Promise<void> {
  if (launchId) {
    await removeContainer(getContainerName(connectionId, launchId));
    return;
  }

  const result = await dockerExec("ps", [
    "-aq",
    "--filter",
    `label=${CONNECTION_LABEL}=${connectionId}`,
  ]);
  assertSuccessful(result, "list containers for the connection");
  const containerIds = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  await Promise.all(containerIds.map(removeContainer));
}

/** Removes only containers carrying this extension's ownership label. */
export async function cleanupMongoExpressContainers(): Promise<void> {
  // Remove the fixed-name container created by releases before per-connection labels existed.
  await removeContainer("dd-ext-mongo-express");

  const result = await dockerExec("ps", ["-aq", "--filter", `label=${OWNER_LABEL}=true`]);
  assertSuccessful(result, "list extension containers");

  const containerIds = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  await Promise.all(containerIds.map(removeContainer));
}

async function resolveMongoTarget(url: string): Promise<{ url: string; network?: string }> {
  const host = getHostname(url);
  const localMongo = await findLocalMongoContainer(host);

  if (localMongo) {
    if (localMongo.network === "bridge" && localMongo.ipAddress) {
      url = replaceHostname(url, localMongo.ipAddress);
    }
    return { url, network: localMongo.network };
  }

  if (isLoopback(host)) {
    url = replaceHostname(url, "host.docker.internal");
  }
  return { url };
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return "";
  }
}

function replaceHostname(url: string, hostname: string): string {
  try {
    const parsed = new URL(url);
    parsed.hostname = hostname;
    return parsed.toString();
  } catch {
    return url;
  }
}

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function findLocalMongoContainer(
  hostname: string,
): Promise<{ network: string; ipAddress?: string } | null> {
  if (!hostname) return null;

  const result = await dockerExec("ps", [
    "--filter",
    "status=running",
    "--format",
    "{{.Names}}|{{.Image}}|{{.Networks}}",
  ]);
  assertSuccessful(result, "find local MongoDB containers");

  for (const line of (result.stdout ?? "").split(/\r?\n/)) {
    const [name, image = "", networks = ""] = line.split("|");
    if (name !== hostname || !isMongoImage(image)) continue;

    const network = networks.split(",")[0]?.trim();
    if (!network) return null;
    if (network !== "bridge") return { network };

    const inspect = await dockerExec("inspect", [
      `--format={{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}`,
      name,
    ]);
    const ipAddress = (inspect.stdout ?? "").trim();
    return { network, ...(ipAddress ? { ipAddress } : {}) };
  }
  return null;
}

function isMongoImage(image: string): boolean {
  const normalized = image.toLowerCase();
  return (
    normalized === "mongo" ||
    normalized.startsWith("mongo:") ||
    normalized === "bitnami/mongodb" ||
    normalized.startsWith("bitnami/mongodb:") ||
    normalized === "circleci/mongo" ||
    normalized.startsWith("circleci/mongo:")
  );
}

function getContainerName(connectionId: string, launchId: string): string {
  const safeConnectionId = connectionId
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "-")
    .slice(0, 36);
  const safeLaunchId = launchId
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "-")
    .slice(0, 36);
  return `dd-ext-mongo-express-${safeConnectionId}-${safeLaunchId}`;
}

async function removeContainer(containerName: string): Promise<void> {
  // Page teardown and Connections cleanup can remove the same container concurrently.
  // Use a command per container so an expected race cannot hide another container's failure.
  let result;
  try {
    result = await dockerExec("rm", ["-f", containerName]);
  } catch (error) {
    if (isExpectedRemovalError(error)) return;
    throw error;
  }

  const failed = result.code !== undefined ? result.code !== 0 : !!result.stderr.trim();
  if (failed) {
    if (isExpectedRemovalError(result.stderr)) return;
    throw new Error(getErrorMessage(result, `Failed to remove container ${containerName}.`));
  }
}

async function runDocker(args: string[]) {
  const result = await dockerExec(args[0], args.slice(1));
  assertSuccessful(result, `docker ${args[0]}`);
  return result;
}

function assertSuccessful(result: Awaited<ReturnType<typeof dockerExec>>, operation: string): void {
  if (result.code !== undefined && result.code !== 0) {
    throw new Error(getErrorMessage(result, `Failed to ${operation}.`));
  }
}

function isExpectedRemovalError(error: unknown): boolean {
  return /no such container|no such object|removal of container \S+ is already in progress/i.test(
    getErrorMessage(error),
  );
}

function getMongoStartupError(logs: string): string | undefined {
  if (/requires authentication|command .* needs authentication/i.test(logs)) {
    return "MongoDB requires authentication. Check the credentials and authSource. For a client certificate, add authMechanism=MONGODB-X509&authSource=%24external to the connection string.";
  }
  if (/authentication failed|bad auth|unable to authenticate/i.test(logs)) {
    return "MongoDB authentication failed. Check the credentials or certificate and the connection string's authMechanism and authSource.";
  }
  if (/not authorized|unauthorized|not allowed to do action/i.test(logs)) {
    if (/serverStatus/i.test(logs)) {
      return "This MongoDB user cannot read server status, which Mongo Express needs in admin mode. Enable Database-scoped mode and include /database in the URI, or use an account with the serverStatus permission.";
    }
    return "MongoDB denied access to databases or collections. Check authentication and database roles. For X.509, set authMechanism=MONGODB-X509&authSource=%24external. If access is limited to one database, enable Database-scoped mode.";
  }
  if (/certificate has expired|CERT_HAS_EXPIRED/i.test(logs)) {
    return "A TLS certificate has expired. Renew the certificate or log in to your database proxy again.";
  }
  if (/ERR_TLS_CERT_ALTNAME_INVALID|Hostname\/IP does not match certificate/i.test(logs)) {
    return "The server certificate does not match the MongoDB hostname. Use the hostname on the certificate, or allow a hostname mismatch in TLS settings for a trusted local proxy.";
  }
  if (/ENOENT|EACCES|EISDIR/.test(logs) && /\/etc\/mongo-express\/tls\//.test(logs)) {
    return "A TLS certificate file could not be read. Select a readable PEM file and check Docker Desktop file sharing.";
  }
  if (/unable to verify|unable to get.*issuer certificate|self.signed certificate/i.test(logs)) {
    return "The server TLS certificate is not trusted. Select the CA certificate supplied by your database provider.";
  }
  if (/PEM routines|ERR_OSSL_PEM|bad decrypt|key values mismatch/i.test(logs)) {
    return "A TLS PEM file is invalid or its private key cannot be read. Check that the client PEM contains both the certificate and its matching private key.";
  }
  const mongoError = logs.match(/^\s*(Mongo\w*Error: .+)$/m)?.[1];
  if (mongoError) return getErrorMessage(mongoError).slice(0, 1000);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
