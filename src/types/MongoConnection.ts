export type MongoConnection = {
  id: string;
  name: string;
  authMethod: "basic" | "connectionString";
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
  directConnection?: boolean;
  connectionString?: string;
  databaseScoped?: boolean;
  databaseName?: string;
  tls?: {
    enabled: boolean;
    caFile?: string;
    certificateKeyFile?: string;
    allowInvalidHostnames?: boolean;
  };
};
