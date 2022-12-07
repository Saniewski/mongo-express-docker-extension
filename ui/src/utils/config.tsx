import { ExtensionConfig } from "../types/ExtensionConfig";
import { dockerDesktopToast } from "../api/utils";

export const SaveConfig = async (extensionConfig: ExtensionConfig | undefined): Promise<boolean> => {
  if (!extensionConfig) {
    return false;
  }
  try {
    // TODO: save config
    return true;
  } catch (error: any) {
    dockerDesktopToast.error(error.toString());
    return false;
  }
};

export const isConfigured = async (): Promise<boolean> => {
  // TODO: read config
  // return config.mongoExpressConfigured;
  // return false;
  return true;
};