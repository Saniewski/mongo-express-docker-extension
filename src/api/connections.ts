import { MongoConnection } from "../types/MongoConnection";

const CONNECTIONS_STORAGE_KEY = "mongo-express.connections.v1";

export function loadConnections(): MongoConnection[] {
  try {
    const savedConnections = window.localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    if (!savedConnections) return [];

    const parsed: unknown = JSON.parse(savedConnections);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isMongoConnection);
  } catch (error) {
    console.error("Failed to load saved MongoDB connections", error);
    return [];
  }
}

export function saveConnections(connections: MongoConnection[]): void {
  window.localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
}

export function createConnectionId(): string {
  return crypto.randomUUID();
}

export function getConnectionEndpoint(connection: MongoConnection): string {
  if (connection.authMethod === "connectionString") {
    try {
      const parsed = new URL(connection.connectionString ?? "");
      return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
    } catch {
      return "Invalid connection string";
    }
  }

  return `${connection.hostname ?? ""}${connection.port ? `:${connection.port}` : ""}`;
}

function isMongoConnection(value: unknown): value is MongoConnection {
  if (!value || typeof value !== "object") return false;
  const connection = value as Partial<MongoConnection>;
  return (
    typeof connection.id === "string" &&
    typeof connection.name === "string" &&
    (connection.authMethod === "basic" || connection.authMethod === "connectionString")
  );
}
