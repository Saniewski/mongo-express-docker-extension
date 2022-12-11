import { ddClient } from "./utils";
import { MongoDbConfig } from "../types/MongoDbConfig";

export class ApiResponse {
  error: boolean;
  message: string;
  data: any;
}

export async function getMongoDbConfig(): Promise<MongoDbConfig> {
  const response = await getConfig();
  if (response.error) {
    throw new Error(response.message);
  }
  return response.data;
}

export async function resetMongoDbConfig(): Promise<MongoDbConfig> {
  const response = await resetConfig();
  if (response.error) {
    throw new Error(response.message);
  }
  return response.data;
}

export async function saveMongoDbConfig(config: MongoDbConfig): Promise<MongoDbConfig> {
  const response = await saveConfig(config);
  if (response.error) {
    throw new Error(response.message);
  }
  return response.data;
}

async function getConfig(): Promise<any> {
  ddClient.extension.vm.service.get('config')
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error;
    });
}

async function resetConfig(): Promise<any> {
  ddClient.extension.vm.service.delete('config')
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error;
    });
}

async function saveConfig(config: MongoDbConfig): Promise<any> {
  ddClient.extension.vm.service.post('config', config)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error;
    });
}
