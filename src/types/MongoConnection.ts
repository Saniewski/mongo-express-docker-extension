export type MongoConnection = {
  id: string;
  name: string;
  authMethod: "basic" | "connectionString";
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
  connectionString?: string;
};
