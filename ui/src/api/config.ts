import { ddClient } from "./utils";
import { ExtensionConfig } from "../types/ExtensionConfig";

export class ApiResponse {
  error!: boolean;
  message!: string;
  data!: ExtensionConfig;
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
  try {
    const service = ddClient.extension.vm?.service;
    if (!service) throw new Error('Extension service is unavailable');
    return await service.get('/config') as ApiResponse;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

async function saveConfig(config: ExtensionConfig): Promise<ApiResponse | Error> {
  try {
    const service = ddClient.extension.vm?.service;
    if (!service) throw new Error('Extension service is unavailable');
    return await service.post('/config', config) as ApiResponse;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}
