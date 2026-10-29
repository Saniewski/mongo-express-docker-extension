import type { MongoConnection } from "../types/MongoConnection";
import { buildMongoConfig, getConnectionSettingsError } from "./mongoConfig";

const connection: MongoConnection = {
  id: "example",
  name: "Example",
  authMethod: "connectionString",
  connectionString: "mongodb://user:p%40ss@db:27017/app?authSource=admin&directConnection=true",
};

test("existing connections retain their URI and do not mount files", () => {
  expect(buildMongoConfig(connection)).toEqual({
    url: connection.connectionString,
    tls: false,
    mounts: [],
  });
});

test("database scope preserves authentication and other URI options", () => {
  expect(buildMongoConfig({ ...connection, databaseScoped: true }).url).toBe(
    connection.connectionString,
  );
});

test("host-and-credentials scope selects a database while preserving admin authentication", () => {
  const config = buildMongoConfig({
    ...connection,
    authMethod: "basic",
    hostname: "db",
    username: "user",
    password: "p@ss",
    databaseName: "app",
    databaseScoped: true,
  });
  expect(config.url).toBe("mongodb://user:p%40ss@db:27017/app?authSource=admin");
});

test.each([
  "mongodb://db",
  "mongodb://db/?authSource=admin",
  "mongodb://db/invalid%2Fname",
  "mongodb://db/invalid%20name",
  "mongodb://db/%XX",
])("rejects an absent or invalid scoped database: %s", (connectionString) => {
  expect(() => buildMongoConfig({ ...connection, connectionString, databaseScoped: true })).toThrow(
    /database/i,
  );
});

test("host-and-credentials scope requires an explicit database", () => {
  expect(
    getConnectionSettingsError({
      ...connection,
      authMethod: "basic",
      hostname: "db",
      databaseScoped: true,
    }),
  ).toMatch(/requires a database name/);
});

test("TLS mounts only the selected files read-only and uses container paths in the URI", () => {
  const config = buildMongoConfig({
    ...connection,
    tls: {
      enabled: true,
      caFile: "/certificates/custom, trusted/ca.pem",
      certificateKeyFile: '/certificates/client "read only".pem',
    },
  });
  const uri = new URL(config.url);
  expect(config.tls).toBe(true);
  expect(uri.username).toBe("user");
  expect(uri.password).toBe("p%40ss");
  expect(uri.searchParams.get("authSource")).toBe("admin");
  expect(uri.searchParams.get("directConnection")).toBe("true");
  expect(uri.searchParams.get("tlsCAFile")).toBe("/etc/mongo-express/tls/ca.pem");
  expect(uri.searchParams.get("tlsCertificateKeyFile")).toBe("/etc/mongo-express/tls/client.pem");
  expect(config.mounts).toEqual([
    'type=bind,"source=/certificates/custom, trusted/ca.pem",target=/etc/mongo-express/tls/ca.pem,readonly',
    'type=bind,"source=/certificates/client ""read only"".pem",target=/etc/mongo-express/tls/client.pem,readonly',
  ]);
});

test("TLS settings restore verification and replace conflicting URI options case-insensitively", () => {
  const config = buildMongoConfig({
    ...connection,
    connectionString:
      "mongodb://db/app?SSL=false&TLS=false&tlsInsecure=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true&TLSCAFile=/old&tlsCertificateKeyFile=/old&sslValidate=false&authSource=admin",
    tls: { enabled: true },
  });
  expect([...new URL(config.url).searchParams]).toEqual([
    ["authSource", "admin"],
    ["tls", "true"],
  ]);
  expect(config.mounts).toEqual([]);
});

test("hostname exceptions never disable CA verification", () => {
  const config = buildMongoConfig({
    ...connection,
    tls: { enabled: true, allowInvalidHostnames: true },
  });
  const params = new URL(config.url).searchParams;
  expect(params.get("tlsAllowInvalidHostnames")).toBe("true");
  expect(params.has("tlsInsecure")).toBe(false);
  expect(params.has("tlsAllowInvalidCertificates")).toBe(false);
});

test.each(["~/ca.pem", "./ca.pem", "ca.pem", "/ca\n.pem", "/ca\0.pem"])(
  "rejects certificate paths Docker cannot safely bind: %s",
  (caFile) => {
    expect(() => buildMongoConfig({ ...connection, tls: { enabled: true, caFile } })).toThrow(
      /absolute file path/,
    );
  },
);

test.each(["C:\\Users\\user\\ca.pem", "C:/Users/user/ca.pem", "\\\\server\\share\\ca.pem"])(
  "accepts absolute Windows certificate paths: %s",
  (caFile) => {
    expect(buildMongoConfig({ ...connection, tls: { enabled: true, caFile } }).mounts).toHaveLength(
      1,
    );
  },
);

test("disabled TLS settings leave the URI untouched and do not use saved file paths", () => {
  expect(
    buildMongoConfig({
      ...connection,
      tls: { enabled: false, caFile: "missing.pem", allowInvalidHostnames: true },
    }),
  ).toEqual(buildMongoConfig(connection));
});

test.each([
  ["mongodb://db/app?tls=true", true],
  ["mongodb://db/app?SSL=true", true],
  ["mongodb+srv://cluster.example/app", true],
  ["mongodb+srv://cluster.example/app?tls=false", false],
])("honors TLS from the URI even without TLS form settings: %s", (connectionString, tls) => {
  expect(buildMongoConfig({ ...connection, connectionString }).tls).toBe(tls);
});

test("TLS preserves replica-set seed lists and authentication options", () => {
  const config = buildMongoConfig({
    ...connection,
    connectionString:
      "mongodb://user:p%40ss@db1:27017,db2:27017/app?replicaSet=rs0&authSource=admin",
    databaseScoped: true,
    tls: { enabled: true },
  });
  expect(config.url).toBe(
    "mongodb://user:p%40ss@db1:27017,db2:27017/app?replicaSet=rs0&authSource=admin&tls=true",
  );
});
