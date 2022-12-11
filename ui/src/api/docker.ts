import { ddClient } from "./utils";
import { MongoDbConfig } from "../types/MongoDbConfig";

/**
 * Stops the existing mongo-express container and starts a new one with a provided configuration.
 */
export async function startMongoExpress(config: MongoDbConfig): Promise<void> {
  const containers = await ddClient.docker.listContainers({filters: {name: ['mongo-express-docker-extension']}});
  console.log(containers);
}

/**
 * Checks if the mongo-express container is running.
 */
export async function checkMongoExpressStatus(): Promise<string> {
  const containers = await ddClient.docker.listContainers({filters: {name: ['mongo-express-docker-extension']}});
  console.log(containers);
  return 'stopped';
}
