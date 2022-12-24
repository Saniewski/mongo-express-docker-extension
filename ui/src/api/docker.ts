import { ddClient } from "./utils";
import { ExtensionConfig } from "../types/ExtensionConfig";
import { MONGO_EXPRESS_CONTAINER_NAME } from "../utils/constants";

/**
 * Removes the existing mongo-express container and starts a new one with a provided configuration.
 */
export async function startMongoExpress(config: ExtensionConfig): Promise<void> {
  // docker run \
  // --network some-network \
  // -e ME_CONFIG_MONGODB_SERVER=some-mongo \
  // -e ME_CONFIG_MONGODB_PORT=27017 \
  // -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin \
  // -e ME_CONFIG_MONGODB_ADMINPASSWORD=secret \
  // --rm -p 8081:8081 \
  // --name dd-ext-mongo-express \
  // mongo-express:latest
  await removeMongoExpress();
  let cliArgs = [];
  const localMongoContainerNetwork = await getLocalMongoContainerNetwork();
  if (localMongoContainerNetwork) {
    cliArgs.push('--network', localMongoContainerNetwork)
  }
  if (config.hostname) {
    cliArgs.push('-e', `ME_CONFIG_MONGODB_SERVER=${config.hostname}`);
  }
  if (config.port) {
    cliArgs.push('-e', `ME_CONFIG_MONGODB_PORT=${config.port}`);
  }
  if (config.username) {
    cliArgs.push('-e', `ME_CONFIG_MONGODB_ADMINUSERNAME=${config.username}`);
  }
  if (config.password) {
    cliArgs.push('-e', `ME_CONFIG_MONGODB_ADMINPASSWORD=${config.password}`);
  }
  if (config.connectionString) {
    const pattern = '^mongodb:\\/\\/(?<credentials>(?<username>\\w+):?(?<password>\\w+)@)?(?<hostname>\\S+):(?<port>\\d+)';
    const match = config.connectionString.match(pattern);
    if (match) {
      const { groups } = match;
      cliArgs.push('-e', `ME_CONFIG_MONGODB_SERVER=${groups.hostname}`);
      cliArgs.push('-e', `ME_CONFIG_MONGODB_PORT=${groups.port}`);
      if (groups.username) {
        cliArgs.push('-e', `ME_CONFIG_MONGODB_ADMINUSERNAME=${groups.username}`);
      }
      if (groups.password) {
        cliArgs.push('-e', `ME_CONFIG_MONGODB_ADMINPASSWORD=${groups.password}`);
      }
    }
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
 * Returns network name of a local docker container running mongo if it's present, otherwise null.
 */
export async function getLocalMongoContainerNetwork(): Promise<string> {
  // docker ps -a --filter status=running --format "{{.ID}} {{.Image}} {{.Networks}}"
  const psResult = await ddClient.docker?.cli?.exec('ps', [
    '-a',
    '--filter', 'status=running',
    '--format', '"{{.ID}} {{.Image}} {{.Networks}}"'
  ]);
  const lines = psResult.lines();
  for (const line of lines) {
    const results = line.split(' ');
    if (results.length === 3) {
      const image = results[1].toLowerCase();
      const network = results[2];
      if (
        image === 'mongo' || image.startsWith('mongo:') ||
        image === 'bitnami/mongodb' || image.startsWith('bitnami/mongodb:') ||
        image === 'circleci/mongo' || image.startsWith('circleci/mongo:')
      ) {
        return network
      }
    }
  }
  return null;
}

/**
 * Checks if the mongo-express container is running.
 */
export async function checkMongoExpressStatus(): Promise<string> {
  // docker ps -a --filter name=dd-ext-mongo-express --format "{{.Status}}"
  const psResult = await ddClient.docker?.cli?.exec('ps', [
    '-a',
    '--filter', `name=${MONGO_EXPRESS_CONTAINER_NAME}`,
    '--format', '{{.Status}}'
  ]);
  const lines = psResult.lines();
  if (lines.length > 0 && lines[0].includes('Up')) {
    return 'up';
  }
  return lines[0];
}

/**
 * Removes the existing mongo-express container.
 */
export async function removeMongoExpress(): Promise<void> {
  // docker rm -f dd-ext-mongo-express
  await ddClient.docker?.cli?.exec('rm', ['-f', MONGO_EXPRESS_CONTAINER_NAME]);
}
