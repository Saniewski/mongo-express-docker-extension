import { MongoDbConfig } from "../types/MongoDbConfig";
import { ddToast } from "../api/utils";
import { getMongoDbConfig, resetMongoDbConfig, saveMongoDbConfig } from "../api/config";

export const SaveConfig = async (mongoDBConfig: MongoDbConfig): Promise<boolean> => {
  // Validate the config
  if (!mongoDBConfig) {
    return false;
  }
  try {
    await saveMongoDbConfig(mongoDBConfig);
    return true;
  } catch (error: any) {
    ddToast.error(error.toString());
    return false;
  }
};

export const LoadConfig = async (): Promise<MongoDbConfig> => {
  return await getMongoDbConfig();
}

export const ResetConfig = async (): Promise<MongoDbConfig> => {
  return await resetMongoDbConfig();
}
