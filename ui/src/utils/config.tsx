import { ExtensionConfig } from "../types/ExtensionConfig";
import { ddToast } from "../api/utils";
import { getExtensionConfig, saveExtensionConfig } from "../api/config";
import { AUTH_BASIC } from "./constants";

export const SaveConfig = async (extensionConfig: ExtensionConfig): Promise<boolean> => {
  // Validate the config
  if (!extensionConfig) {
    return false;
  }
  try {
    await saveExtensionConfig(extensionConfig);
    return true;
  } catch (error: any) {
    ddToast.error(error.toString());
    return false;
  }
};

export const LoadConfig = async (): Promise<ExtensionConfig> => {
  const config = await getExtensionConfig();
  return {
    ...config,
    rememberCredentials: config.rememberCredentials ?? false,
    authMethod: config.authMethod ?? AUTH_BASIC
  };
}

export const ResetConfig = async (): Promise<ExtensionConfig> => {
  const config: ExtensionConfig = {
    hostname: 'localhost',
    port: 27017,
    username: undefined,
    password: undefined,
    connectionString: 'mongodb://localhost:27017',
    rememberCredentials: false,
    authMethod: AUTH_BASIC,
  }
  await SaveConfig(config);
  return config;
}
