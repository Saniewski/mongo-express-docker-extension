import type { v1 } from "@docker/extension-api-client-types";
import { ddClient } from "./utils";
import { dockerExec } from "./dockerCli";

jest.mock("./utils", () => ({ ddClient: { docker: { cli: { exec: jest.fn() } } } }));

const exec = jest.mocked<
  (command: string, args: string[], options: v1.SpawnOptions) => v1.ExecProcess
>(ddClient.docker.cli.exec);

beforeEach(() => {
  exec.mockReset().mockReturnValue({ close: jest.fn() });
});

test.each<[string, string[]]>([
  ["ps", ["--format", "{{.Names}}|{{.Image}}|{{.Networks}}"]],
  [
    "run",
    [
      "-e",
      "ME_CONFIG_MONGODB_URL=mongodb://user:p%40ss@localhost:27017/?authSource=admin&directConnection=true",
      "mongo-express:latest",
    ],
  ],
  ["inspect", ["--format={{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "mongo"]],
])("passes %s arguments to streaming exec without shell quoting", async (command, args) => {
  const completion = dockerExec(command, args);
  const stream = exec.mock.calls[0][2].stream;
  expect(exec).toHaveBeenCalledWith(command, args, { stream });
  stream.onOutput?.({ stdout: "first" });
  stream.onOutput?.({ stderr: "warning" });
  stream.onOutput?.({ stdout: " second\n" });
  stream.onClose?.(0);
  await expect(completion).resolves.toEqual({
    code: 0,
    stdout: "first second\n",
    stderr: "warning",
  });
});

test("waits for process exit before returning its output", async () => {
  const resolved = jest.fn();
  const completion = dockerExec("run", ["mongo-express:latest"]).then(resolved);
  const stream = exec.mock.calls[0][2].stream;
  stream.onOutput?.({ stdout: "container-id\n" });
  await Promise.resolve();
  expect(resolved).not.toHaveBeenCalled();
  stream.onClose?.(0);
  await completion;
  expect(resolved).toHaveBeenCalledWith({ code: 0, stdout: "container-id\n", stderr: "" });
});

test("preserves nonzero exits so callers can handle missing containers", async () => {
  const completion = dockerExec("inspect", ["missing"]);
  const stream = exec.mock.calls[0][2].stream;
  stream.onOutput?.({ stderr: "Error: No such object: missing" });
  stream.onClose?.(1);
  await expect(completion).resolves.toEqual({
    code: 1,
    stdout: "",
    stderr: "Error: No such object: missing",
  });
});

test("turns plain SDK error objects into readable errors", async () => {
  const completion = dockerExec("run", ["mongo-express:latest"]);
  exec.mock.calls[0][2].stream.onError?.({ stderr: "Cannot connect to the Docker daemon" });
  await expect(completion).rejects.toThrow("Cannot connect to the Docker daemon");
});

test("normalizes errors thrown before streaming starts", async () => {
  exec.mockImplementation(() => {
    throw { message: "Docker Desktop is unavailable" };
  });
  await expect(dockerExec("ps", [])).rejects.toThrow("Docker Desktop is unavailable");
});
