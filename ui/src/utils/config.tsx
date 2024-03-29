import { ExtensionConfig } from "../types/ExtensionConfig";
import { ddToast } from "../api/utils";
import { getExtensionConfig, saveExtensionConfig } from "../api/config";
import { AUTH_BASIC } from "./constants";

export const SaveConfig = async (extensionConfig: ExtensionConfig): Promise<boolean> => {
  if (!extensionConfig) {
    return false;
  }
  try {
    await saveExtensionConfig(extensionConfig);
    return true;
  } catch (error: any) {
    ddToast.error(error.stderr);
    return false;
  }
};

export const LoadConfig = async (): Promise<ExtensionConfig> => {
  return await getExtensionConfig();
}

export const ResetConfig = async (): Promise<ExtensionConfig> => {
  const config: ExtensionConfig = {
    hostname: 'localhost',
    port: 27017,
    username: '',
    password: '',
    connectionString: 'mongodb://localhost:27017',
    rememberCredentials: false,
    authMethod: AUTH_BASIC,
  }
  await SaveConfig(config);
  return config;
}
