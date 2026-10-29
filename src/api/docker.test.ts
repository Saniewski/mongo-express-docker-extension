import type { v1 } from "@docker/extension-api-client-types";
import type { MongoConnection } from "../types/MongoConnection";
import { dockerExec } from "./dockerCli";
import {
  startMongoExpress,
  checkMongoExpress,
  removeMongoExpress,
  testMongoConnection,
} from "./docker";

jest.mock("./dockerCli", () => ({ dockerExec: jest.fn() }));

const exec = jest.mocked(dockerExec);
const connection: MongoConnection = {
  id: "test-connection",
  name: "Local MongoDB",
  authMethod: "basic",
  hostname: "localhost",
  port: 27018,
  username: "testuser",
  password: "p@ss:word/?#%",
};

function result(stdout = "", code?: number, stderr = ""): v1.RawExecResult {
  return {
    stdout,
    stderr,
    ...(code === undefined ? {} : { code }),
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { setTimeout } });
  exec.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
  Reflect.deleteProperty(globalThis, "window");
});

test.each([undefined, 0])("starts with credentials when the SDK exit code is %s", async (code) => {
  exec.mockImplementation(async (command) => {
    if (command === "port") return result("127.0.0.1:49152\n", code);
    return result("", code);
  });
  await Promise.all([
    expect(startMongoExpress(connection, "launch")).resolves.toBe(49152),
    jest.runAllTimersAsync(),
  ]);
  const args = exec.mock.calls.find(([command]) => command === "run")?.[1];
  expect(args).toContain(
    "ME_CONFIG_MONGODB_URL=mongodb://testuser:p%40ss%3Aword%2F%3F%23%25@host.docker.internal:27018",
  );
  expect(args).toContain("127.0.0.1::8081");
  expect(args).toContain("ME_CONFIG_BASICAUTH=false");
  expect(args).toContain("ME_CONFIG_MONGODB_ENABLE_ADMIN=true");
  expect(args).toContain("ME_CONFIG_MONGODB_SSL=false");
  expect(exec.mock.calls.filter(([command]) => command === "rm")).toHaveLength(1);
});

test.each([undefined, 0])(
  "starts with a connection string when the SDK exit code is %s",
  async (code) => {
    exec.mockImplementation(async (command) => {
      if (command === "port") return result("127.0.0.1:49152\n", code);
      return result("", code);
    });
    await Promise.all([
      expect(
        startMongoExpress(
          {
            ...connection,
            authMethod: "connectionString",
            connectionString:
              "mongodb://user:p%40ss@127.0.0.1:27018/app?authSource=admin&directConnection=true",
          },
          "launch",
        ),
      ).resolves.toBe(49152),
      jest.runAllTimersAsync(),
    ]);
    const args = exec.mock.calls.find(([command]) => command === "run")?.[1];
    expect(args).toContain(
      "ME_CONFIG_MONGODB_URL=mongodb://user:p%40ss@host.docker.internal:27018/app?authSource=admin&directConnection=true",
    );
  },
);

test.each([undefined, 0])("detects readiness when the SDK exit code is %s", async (code) => {
  exec.mockImplementation(async (command) =>
    command === "inspect"
      ? result("running\n", code)
      : result("Mongo Express server listening at http://0.0.0.0:8081", code),
  );
  await expect(checkMongoExpress(connection.id, "launch")).resolves.toBe("up");
});

test.each(["exited", "dead"])(
  "detects a container that is %s without an SDK exit code",
  async (status) => {
    exec.mockResolvedValue(result(`${status}\n`));
    await expect(checkMongoExpress(connection.id, "launch")).resolves.toBe("exited");
  },
);

test("does not treat a failed inspect as ready", async () => {
  exec.mockResolvedValue(result("running\n", 1, "inspect failed"));
  await expect(checkMongoExpress(connection.id, "launch")).resolves.toBeNull();
});

test("propagates a failed Docker run", async () => {
  exec.mockImplementation(async (command) =>
    command === "run" ? result("", 125, "Docker could not start the container") : result(),
  );
  await expect(startMongoExpress(connection, "launch")).rejects.toThrow(
    "Docker could not start the container",
  );
});

test("removes the container if Docker never assigns a port", async () => {
  exec.mockResolvedValue(result());
  await Promise.all([
    expect(startMongoExpress(connection, "launch")).rejects.toThrow(
      "Docker did not assign a host port",
    ),
    jest.runAllTimersAsync(),
  ]);
  expect(exec.mock.calls.filter(([command]) => command === "rm")).toHaveLength(2);
});

test("ignores missing containers reported through an SDK rejection", async () => {
  exec.mockRejectedValue({ stderr: "Error response from daemon: No such container: test" });
  await expect(removeMongoExpress(connection.id, "launch")).resolves.toBeUndefined();
});

test("keeps the startup error if cleanup also fails", async () => {
  const cleanupError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  let removals = 0;
  exec.mockImplementation(async (command) => {
    if (command === "port") throw new Error("Cannot inspect published port");
    if (command === "rm" && ++removals > 1) throw new Error("Cleanup failed");
    return result();
  });
  try {
    await expect(startMongoExpress(connection, "launch")).rejects.toThrow(
      "Cannot inspect published port",
    );
  } finally {
    cleanupError.mockRestore();
  }
});

test.each(["basic", "connectionString"] as const)(
  "launches scoped TLS connections with %s",
  async (authMethod) => {
    exec.mockImplementation(async (command) =>
      command === "port" ? result("127.0.0.1:49152\n") : result(),
    );
    await expect(
      startMongoExpress(
        {
          ...connection,
          authMethod,
          username: "",
          password: "",
          directConnection: true,
          databaseName: "app",
          connectionString: "mongodb://localhost:27017/app?directConnection=true",
          databaseScoped: true,
          tls: { enabled: true, caFile: "/certs/ca.pem", certificateKeyFile: "/certs/client.pem" },
        },
        "launch",
      ),
    ).resolves.toBe(49152);
    const args = exec.mock.calls.find(([command]) => command === "run")?.[1] ?? [];
    expect(args).toContain("ME_CONFIG_MONGODB_ENABLE_ADMIN=false");
    expect(args).toContain("ME_CONFIG_MONGODB_SSL=true");
    expect(args.filter((arg) => arg === "--mount")).toHaveLength(2);
    expect(args).toContain(
      'type=bind,"source=/certs/client.pem",target=/etc/mongo-express/tls/client.pem,readonly',
    );
    const uri = new URL(
      args
        .find((arg) => arg.startsWith("ME_CONFIG_MONGODB_URL="))!
        .split("ME_CONFIG_MONGODB_URL=")[1],
    );
    expect(uri.hostname).toBe("host.docker.internal");
    expect(uri.pathname).toBe("/app");
    expect(uri.searchParams.get("directConnection")).toBe("true");
    expect(uri.searchParams.get("tlsCertificateKeyFile")).toBe("/etc/mongo-express/tls/client.pem");
  },
);

test("invalid settings fail before any container is removed or created", async () => {
  await expect(
    startMongoExpress({ ...connection, databaseScoped: true }, "launch"),
  ).rejects.toThrow(/requires a database name/);
  expect(exec).not.toHaveBeenCalled();
});

test.each([
  ["MongoServerSelectionError: certificate has expired", /certificate has expired/],
  ["ERR_TLS_CERT_ALTNAME_INVALID", /does not match/],
  ["ENOENT /etc/mongo-express/tls/client.pem", /could not be read/],
  ["unable to verify the first certificate", /not trusted/],
  ["ERR_OSSL_PEM_NO_START_LINE", /PEM file is invalid/],
])("reports actionable TLS startup errors: %s", async (logs, message) => {
  exec.mockImplementation(async (command) =>
    command === "inspect" ? result("exited\n") : result(logs),
  );
  await expect(checkMongoExpress(connection.id, "launch")).rejects.toThrow(message);
});

test.each([undefined, 0])("tests a connection when the SDK exit code is %s", async (code) => {
  exec.mockImplementation(async (command) =>
    command === "run" ? result("MONGO_CONNECTION_TEST_OK\n", code) : result(),
  );
  await expect(testMongoConnection(connection)).resolves.toBeUndefined();
  const args = exec.mock.calls.find(([command]) => command === "run")![1];
  expect(args).toContain(
    "ME_CONFIG_MONGODB_URL=mongodb://testuser:p%40ss%3Aword%2F%3F%23%25@host.docker.internal:27018",
  );
  expect(args).toContain("--rm");
  expect(args).not.toContain("-p");
  const containerName = args[args.indexOf("--name") + 1];
  expect(exec).toHaveBeenLastCalledWith("rm", ["-f", containerName]);
});

test.each([undefined, 0])("requires a successful ping, even with exit code %s", async (code) => {
  exec.mockResolvedValue(result("", code));
  await expect(testMongoConnection(connection)).rejects.toThrow(
    "The connection test ended without a result.",
  );
  expect(exec).toHaveBeenLastCalledWith("rm", ["-f", expect.any(String)]);
});

test.each([
  [1, "Authentication failed.", "Authentication failed."],
  [undefined, "connect ECONNREFUSED 192.0.2.1:27017", "connect ECONNREFUSED 192.0.2.1:27017"],
  [1, "certificate has expired", "A TLS certificate has expired."],
  [1, "The connection test timed out after 15 seconds.", "timed out after 15 seconds"],
  [125, "invalid mount config: bind source path does not exist", "bind source path does not exist"],
  [1, "Failed: mongodb://user:secret@host/app", "Failed: mongodb://[redacted]@host/app"],
])("reports connection test failure %s: %s", async (code, stderr, expected) => {
  exec.mockImplementation(async (command) =>
    command === "run" ? result("", code, stderr) : result(),
  );
  await expect(testMongoConnection(connection)).rejects.toThrow(expected);
  expect(exec).toHaveBeenLastCalledWith("rm", ["-f", expect.any(String)]);
});

test.each(["basic", "connectionString"] as const)(
  "tests scoped TLS settings with %s on the MongoDB container's network",
  async (authMethod) => {
    exec.mockImplementation(async (command) => {
      if (command === "ps") return result("database|mongo:9|app-network\n");
      if (command === "run") return result("MONGO_CONNECTION_TEST_OK\n");
      return result();
    });
    await testMongoConnection({
      ...connection,
      authMethod,
      hostname: "database",
      databaseName: "app",
      directConnection: true,
      connectionString:
        "mongodb://user:password@database/app?authSource=admin&directConnection=true",
      databaseScoped: true,
      tls: { enabled: true, caFile: "/certs/ca.pem", certificateKeyFile: "/certs/client.pem" },
    });
    const args = exec.mock.calls.find(([command]) => command === "run")![1];
    expect(args[args.indexOf("--network") + 1]).toBe("app-network");
    expect(args.filter((arg) => arg === "--mount")).toHaveLength(2);
    expect(args).toContain(
      'type=bind,"source=/certs/client.pem",target=/etc/mongo-express/tls/client.pem,readonly',
    );
    const uri = new URL(
      args
        .find((arg) => arg.startsWith("ME_CONFIG_MONGODB_URL="))!
        .split("ME_CONFIG_MONGODB_URL=")[1],
    );
    expect(uri.hostname).toBe("database");
    expect(uri.pathname).toBe("/app");
    expect(uri.searchParams.get("authSource")).toBe("admin");
    expect(uri.searchParams.get("directConnection")).toBe("true");
    expect(uri.searchParams.get("tls")).toBe("true");
    expect(uri.searchParams.get("tlsCertificateKeyFile")).toBe("/etc/mongo-express/tls/client.pem");
  },
);

test("connection tests use unique containers without removing a saved session", async () => {
  exec.mockImplementation(async (command) =>
    command === "run" ? result("MONGO_CONNECTION_TEST_OK\n") : result(),
  );
  await testMongoConnection(connection);
  await testMongoConnection(connection);
  const names = exec.mock.calls
    .filter(([command]) => command === "run")
    .map(([, args]) => args[args.indexOf("--name") + 1]);
  expect(new Set(names).size).toBe(2);
  expect(names.every((name) => name.startsWith("dd-ext-mongo-express-test-"))).toBe(true);
  expect(exec.mock.calls.filter(([command]) => command === "rm")).toEqual(
    names.map((name) => ["rm", ["-f", name]]),
  );
});

test("invalid test settings fail before contacting Docker", async () => {
  await expect(testMongoConnection({ ...connection, hostname: "" })).rejects.toThrow(
    "The MongoDB hostname is required.",
  );
  expect(exec).not.toHaveBeenCalled();
});

test("preserves the connection error when cleanup fails after an SDK rejection", async () => {
  const cleanupError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  exec.mockImplementation(async (command) => {
    if (command === "run") throw { stderr: "Docker Desktop is unavailable" };
    if (command === "rm") throw new Error("Cleanup failed");
    return result();
  });
  try {
    await expect(testMongoConnection(connection)).rejects.toThrow("Docker Desktop is unavailable");
    expect(exec).toHaveBeenLastCalledWith("rm", ["-f", expect.any(String)]);
  } finally {
    cleanupError.mockRestore();
  }
});
