import { ddClient } from "./utils";
import { ExtensionConfig } from "../types/ExtensionConfig";
import { MONGO_EXPRESS_CONTAINER_NAME, MONGO_EXPRESS_CONNECTION_SUCCESSFUL_MESSAGE } from "../utils/constants";

/**
 * Removes the existing mongo-express container and starts a new one with a provided configuration.
 */
export async function startMongoExpress(config: ExtensionConfig): Promise<void> {
  /*
  docker run \
  --network some-network \
  -e ME_CONFIG_MONGODB_URL=mongo://admin:secret@some-mongo:27017 \
  --rm -p 8081:8081 \
  --name dd-ext-mongo-express \
  mongo-express:latest
   */
  await removeMongoExpress();
  let cliArgs = [];
  let hostname = config.hostname;
  if (config.connectionString) {
    cliArgs.push('-e', `"ME_CONFIG_MONGODB_URL=${config.connectionString}"`);
    const pattern =
      '^mongodb(\\+srv)??:\\/\\/(?<credentials>(?<username>\\w+):?(?<password>\\w+)\@)?' +
      '(?<hostname>[\\w.]+)(:(?<port>\\d+))?';
    const match = config.connectionString.match(pattern);
    if (match) {
      const { groups } = match;
      if (groups.hostname) {
        hostname = groups.hostname;
      }
    }
  } else if (config.username && config.password) {
    cliArgs.push('-e',
      `ME_CONFIG_MONGODB_URL=mongodb://${config.username}:${config.password}@${config.hostname}:${config.port}`);
  } else {
    cliArgs.push('-e', `ME_CONFIG_MONGODB_URL=mongodb://${config.hostname}:${config.port}`);
  }
  const localMongoContainerNameAndNetwork = await getLocalMongoContainerNameAndNetwork();
  if (localMongoContainerNameAndNetwork && localMongoContainerNameAndNetwork[0].includes(hostname)) {
    cliArgs.push('--network', localMongoContainerNameAndNetwork[1])
  }
  cliArgs.push(
    // '-e', 'ME_CONFIG_MONGODB_ENABLE_ADMIN=true',
    // '--rm',
    '-d',
    '-p', '8081:8081',
    '--name', MONGO_EXPRESS_CONTAINER_NAME,
    'mongo-express:latest'
  );
  await ddClient.docker?.cli?.exec('run', cliArgs);
}

/**
 * Returns container name and network name of a local docker container running mongo if it's present, otherwise null.
 */
export async function getLocalMongoContainerNameAndNetwork(): Promise<[string, string]> {
  // docker ps -a --filter status=running --format "{{.ID}} {{.Names}} {{.Image}} {{.Networks}}"
  const psResult = await ddClient.docker?.cli?.exec('ps', [
    '-a',
    '--filter', 'status=running',
    '--format', '"{{.ID}} {{.Names}} {{.Image}} {{.Networks}}"'
  ]);
  const lines = psResult.lines();
  for (const line of lines) {
    const results = line.split(' ');
    if (results.length === 4) {
      const name = results[1];
      const image = results[2].toLowerCase();
      const network = results[3];
      if (
        image === 'mongo' || image.startsWith('mongo:') ||
        image === 'bitnami/mongodb' || image.startsWith('bitnami/mongodb:') ||
        image === 'circleci/mongo' || image.startsWith('circleci/mongo:')
      ) {
        return [name, network];
      }
    }
  }
  return null;
}

/**
 * Checks if the mongo-express container is running.
 */
export async function checkIfMongoExpressIsUp(): Promise<string> {
  const status = await getMongoExpressStatus();
  if (status.toLowerCase().includes('exited')) {
    return 'exited';
  }
  if (status.toLowerCase().includes('up')) {
    const logs = await getMongoExpressLogs();
    console.dir(logs);
    if (logs.includes(MONGO_EXPRESS_CONNECTION_SUCCESSFUL_MESSAGE)) {
      return 'up';
    }
  }
  return null;
}

/**
 * Checks if the mongo-express container is running.
 */
export async function getMongoExpressStatus(): Promise<string> {
  // docker ps -a --filter name=dd-ext-mongo-express --format "{{.Status}}"
  const psResult = await ddClient.docker?.cli?.exec('ps', [
    '-a',
    '--filter', `name=${MONGO_EXPRESS_CONTAINER_NAME}`,
    '--format', '{{.Status}}'
  ]);
  const lines = psResult.lines();
  if (lines.length > 0) {
    return lines[0];
  }
  return null;
}

/**
 * Returns the mongo-express container logs.
 */
export async function getMongoExpressLogs(): Promise<string> {
  // docker logs -t --details dd-ext-mongo-express
  const logsResult = await ddClient.docker?.cli?.exec('logs', [
    '-t',
    '--details',
    MONGO_EXPRESS_CONTAINER_NAME
  ]);
  const lines = logsResult.lines();
  return lines.join('\n');
}

/**
 * Removes the existing mongo-express container.
 */
export async function removeMongoExpress(): Promise<void> {
  // docker rm -f dd-ext-mongo-express
  await ddClient.docker?.cli?.exec('rm', ['-f', MONGO_EXPRESS_CONTAINER_NAME]);
}
