import type { MongoConnection } from "../types/MongoConnection";

type ConnectionSettings = Omit<MongoConnection, "id" | "name">;
const CERTIFICATE_DIRECTORY = "/etc/mongo-express/tls";

/** Resolve user settings without reading certificate contents into the extension. */
export function buildMongoConfig(connection: ConnectionSettings): {
  url: string;
  tls: boolean;
  mounts: string[];
} {
  let url: string;
  if (connection.authMethod === "connectionString") {
    url = connection.connectionString?.trim() ?? "";
  } else {
    const hostname = connection.hostname?.trim();
    if (!hostname) throw new Error("The MongoDB hostname is required.");
    const port = connection.port ?? 27017;
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("The MongoDB port must be between 1 and 65535.");
    }
    const credentials = connection.username
      ? `${encodeURIComponent(connection.username)}:${encodeURIComponent(connection.password ?? "")}@`
      : "";
    url = `mongodb://${credentials}${hostname}:${port}`;
    if (connection.databaseScoped) {
      const database = connection.databaseName?.trim() ?? "";
      validateDatabaseName(database);
      url += `/${encodeURIComponent(database)}`;
      // Host-and-credentials connections have always authenticated against admin.
      if (credentials) url += "?authSource=admin";
    }
  }

  const parsed = parseMongoUrl(url);
  if (connection.databaseScoped) {
    let database: string;
    try {
      database = decodeURIComponent(parsed.path.slice(1));
    } catch {
      throw new Error("The database name in the connection string is not valid URL encoding.");
    }
    validateDatabaseName(database);
  }

  const mounts: string[] = [];
  if (connection.tls?.enabled) {
    // The TLS form owns these options, including aliases and differently cased keys.
    const overridden = new Set([
      "tls",
      "ssl",
      "tlscafile",
      "tlscertificatekeyfile",
      "tlsinsecure",
      "tlsallowinvalidcertificates",
      "tlsallowinvalidhostnames",
      "sslvalidate",
    ]);
    for (const key of [...parsed.query.keys()]) {
      if (overridden.has(key.toLowerCase())) parsed.query.delete(key);
    }
    parsed.query.set("tls", "true");
    const files = [
      ["CA certificate", connection.tls.caFile, "ca.pem", "tlsCAFile"],
      [
        "Client certificate/key",
        connection.tls.certificateKeyFile,
        "client.pem",
        "tlsCertificateKeyFile",
      ],
    ] as const;
    for (const [label, file, filename, option] of files) {
      const source = file?.trim();
      if (!source) continue;
      if (!isAbsoluteCertificatePath(source)) {
        throw new Error(`${label} must be an absolute file path on your computer.`);
      }
      const target = `${CERTIFICATE_DIRECTORY}/${filename}`;
      // Docker --mount uses CSV, independently of the CLI's argument boundaries.
      mounts.push(`type=bind,"source=${source.replace(/"/g, '""')}",target=${target},readonly`);
      parsed.query.set(option, target);
    }
    if (connection.tls.allowInvalidHostnames) {
      parsed.query.set("tlsAllowInvalidHostnames", "true");
    }
    url = `${parsed.base}${parsed.path || "/"}?${parsed.query}`;
  }

  const tlsOption = [...parsed.query].find(([key]) => /^(tls|ssl)$/i.test(key))?.[1];
  return {
    url,
    tls: tlsOption === undefined ? parsed.base.startsWith("mongodb+srv:") : tlsOption === "true",
    mounts,
  };
}

export function getConnectionSettingsError(connection: ConnectionSettings): string {
  try {
    buildMongoConfig(connection);
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "Check the connection settings.";
  }
}

function isAbsoluteCertificatePath(value: string): boolean {
  return /^(\/|[a-z]:[\\/]|\\\\)/i.test(value) && !/[\0\r\n]/.test(value);
}

function validateDatabaseName(database: string): void {
  if (!database) {
    throw new Error(
      "Database-scoped mode requires a database name. For a connection string, add /database after the host and port.",
    );
  }
  if (/[/\\.\s"$\0]/.test(database) || new TextEncoder().encode(database).length > 63) {
    throw new Error(
      "The database name must be under 64 bytes and cannot contain spaces, dots, slashes, quotes, or dollar signs.",
    );
  }
}

function parseMongoUrl(value: string): { base: string; path: string; query: URLSearchParams } {
  // Split the URI without URL's single-host restriction: MongoDB supports seed lists.
  const match = value.match(/^(mongodb(?:\+srv)?):\/\/([^/?#]+)(\/[^?#]*)?(?:\?([^#]*))?$/);
  if (match) {
    const hosts = match[2].slice(match[2].lastIndexOf("@") + 1).split(",");
    try {
      for (const host of hosts) {
        const parsed = new URL(`http://${host}`);
        if (
          !parsed.hostname ||
          /\s/.test(host) ||
          (match[1] === "mongodb+srv" && (hosts.length > 1 || host.includes(":")))
        ) {
          throw new Error("Invalid hostname");
        }
      }
      return {
        base: `${match[1]}://${match[2]}`,
        path: match[3] ?? "",
        query: new URLSearchParams(match[4]),
      };
    } catch {
      // Use one actionable message for incomplete or invalid connection strings.
    }
  }
  throw new Error("Use a valid mongodb:// or mongodb+srv:// connection string.");
}
