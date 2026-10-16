import { ddClient } from "./utils";
import { MongoConnection } from "../types/MongoConnection";

const MONGO_EXPRESS_IMAGE = "mongo-express:latest";
const MONGO_EXPRESS_PORT = 8081;
const OWNER_LABEL = "com.saniewski.mongo-express-docker-extension";
const CONNECTION_LABEL = `${OWNER_LABEL}.connection-id`;
const CONNECTION_SUCCESSFUL_MESSAGE = "Mongo Express server listening";

/**
 * Starts an isolated Mongo Express container for a connection and returns its host port.
 * Containers are created lazily, only when the user opens a saved connection.
 */
export async function startMongoExpress(
  connection: MongoConnection,
  launchId: string,
): Promise<number> {
  const containerName = getContainerName(connection.id, launchId);
  await removeContainer(containerName);

  const target = await resolveMongoTarget(connection);
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
  ];

  if (target.network) args.push("--network", target.network);
  args.push(MONGO_EXPRESS_IMAGE);

  await runDocker(args);

  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await dockerExec("port", [containerName, `${MONGO_EXPRESS_PORT}/tcp`]);
      if (result.code === 0) {
        const port = result.stdout.match(/:(\d+)\s*$/m)?.[1];
        if (port) return Number(port);
      }
      await wait(250);
    }
    throw new Error("Docker did not assign a host port to Mongo Express.");
  } catch (error) {
    await removeContainer(containerName);
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
  if (inspect.code !== 0) return null;

  const status = inspect.stdout.trim().toLowerCase();
  if (status === "exited" || status === "dead") return "exited";
  if (status !== "running") return null;

  const logs = await dockerExec("logs", [containerName]);
  const output = `${logs.stdout}\n${logs.stderr}`;
  return output.includes(CONNECTION_SUCCESSFUL_MESSAGE) ? "up" : null;
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
  const containerIds = result
    .lines()
    .map((line) => line.trim())
    .filter(Boolean);
  if (containerIds.length > 0) {
    await runDocker(["rm", "-f", ...containerIds]);
  }
}

/** Removes only containers carrying this extension's ownership label. */
export async function cleanupMongoExpressContainers(): Promise<void> {
  // Remove the fixed-name container created by releases before per-connection labels existed.
  await removeContainer("dd-ext-mongo-express");

  const result = await dockerExec("ps", ["-aq", "--filter", `label=${OWNER_LABEL}=true`]);
  assertSuccessful(result, "list extension containers");

  const containerIds = result
    .lines()
    .map((line) => line.trim())
    .filter(Boolean);
  if (containerIds.length > 0) {
    await runDocker(["rm", "-f", ...containerIds]);
  }
}

async function resolveMongoTarget(
  connection: MongoConnection,
): Promise<{ url: string; network?: string }> {
  let url = buildMongoUrl(connection);
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

function buildMongoUrl(connection: MongoConnection): string {
  if (connection.authMethod === "connectionString") {
    const value = connection.connectionString?.trim();
    if (!value) throw new Error("The MongoDB connection string is empty.");
    return value;
  }

  const hostname = connection.hostname?.trim();
  if (!hostname) throw new Error("The MongoDB hostname is required.");
  const port = connection.port || 27017;
  const credentials = connection.username
    ? `${encodeURIComponent(connection.username)}:${encodeURIComponent(connection.password ?? "")}@`
    : "";
  return `mongodb://${credentials}${hostname}:${port}`;
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

  for (const line of result.lines()) {
    const [name, image = "", networks = ""] = line.split("|");
    if (name !== hostname || !isMongoImage(image)) continue;

    const network = networks.split(",")[0]?.trim();
    if (!network) return null;
    if (network !== "bridge") return { network };

    const inspect = await dockerExec("inspect", [
      `--format={{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}`,
      name,
    ]);
    const ipAddress = inspect.stdout.trim();
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
  // A missing container is expected when closing a connection or cleaning an old install.
  let result;
  try {
    result = await dockerExec("rm", ["-f", containerName]);
  } catch (error) {
    if (isMissingContainerError(error)) return;
    throw error;
  }

  const failed = result.code !== undefined ? result.code !== 0 : !!result.stderr.trim();
  if (failed) {
    if (isMissingContainerError(result.stderr)) return;
    throw new Error(result.stderr.trim() || `Failed to remove container ${containerName}.`);
  }
}

async function runDocker(args: string[]) {
  const result = await dockerExec(args[0], args.slice(1));
  assertSuccessful(result, `docker ${args.join(" ")}`);
  return result;
}

function dockerExec(command: string, args: string[]) {
  return ddClient.docker.cli.exec(command, args);
}

function assertSuccessful(result: Awaited<ReturnType<typeof dockerExec>>, operation: string): void {
  if (result.code !== undefined && result.code !== 0) {
    throw new Error(result.stderr.trim() || `Failed to ${operation}.`);
  }
}

function isMissingContainerError(error: unknown): boolean {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object"
        ? [
            error instanceof Error ? error.message : "",
            "stderr" in error ? String(error.stderr) : "",
          ].join(" ")
        : "";
  return /no such container|no such object/i.test(message);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
