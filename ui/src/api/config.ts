import { ddClient } from "./utils";
import { ExtensionConfig } from "../types/ExtensionConfig";

export class ApiResponse {
  error: boolean;
  message: string;
  data: ExtensionConfig;
}

export async function getExtensionConfig(): Promise<ExtensionConfig> {
  const response = await getConfig();
  if (response instanceof Error) {
    throw response;
  }
  if (response.error) {
    throw new Error(response.message);
  }
  return response.data;
}

export async function saveExtensionConfig(config: ExtensionConfig): Promise<ExtensionConfig> {
  const response = await saveConfig(config);
  if (response instanceof Error) {
    throw response;
  }
  if (response.error) {
    throw new Error(response.message);
  }
  return response.data;
}

async function getConfig(): Promise<ApiResponse | Error> {
  return ddClient.extension.vm?.service?.get('/config')
    .then((response: ApiResponse) => {
      return response;
    })
    .catch((error: Error) => {
      return error;
    });
}

async function saveConfig(config: ExtensionConfig): Promise<ApiResponse | Error> {
  return ddClient.extension.vm?.service?.post('/config', config)
    .then((response: ApiResponse) => {
      return response;
    })
    .catch((error: Error) => {
      return error;
    });
}
