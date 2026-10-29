import type { v1 } from "@docker/extension-api-client-types";
import type { MongoConnection } from "../types/MongoConnection";
import { dockerExec } from "./dockerCli";
import { startMongoExpress, checkMongoExpress, removeMongoExpress } from "./docker";

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
