/// <reference types="node" />
import { runInNewContext } from "node:vm";
import { CONNECTION_TEST_SCRIPT, CONNECTION_TEST_SUCCESSFUL_MESSAGE } from "./mongoScripts";

function databaseCheck(databaseScoped = false) {
  const listDatabases = jest
    .fn()
    .mockResolvedValue({ databases: [{ name: "app" }, { name: "other" }] });
  const serverStatus = jest.fn().mockResolvedValue({ ok: 1 });
  const collections = jest.fn().mockResolvedValue([]);
  const ping = jest.fn().mockResolvedValue({ ok: 1 });
  const client = {
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    db: jest.fn((name = "app") => ({
      admin: () => ({ listDatabases, serverStatus }),
      command: ping,
      listCollections: () => ({ toArray: () => collections(name) }),
    })),
  };
  const output = { log: jest.fn(), error: jest.fn() };
  const process = {
    env: {
      ME_CONFIG_MONGODB_URL: "mongodb://db/app?authMechanism=MONGODB-X509&authSource=%24external",
      ME_CONFIG_MONGODB_ENABLE_ADMIN: String(!databaseScoped),
      ME_CONFIG_MONGODB_SSL: "true",
    },
    exitCode: 0,
  };
  const run = () =>
    runInNewContext(CONNECTION_TEST_SCRIPT, {
      require: () => ({
        MongoClient: function () {
          return client;
        },
      }),
      console: output,
      process,
      setTimeout,
      clearTimeout,
    });
  return { run, client, listDatabases, serverStatus, collections, ping, output, process };
}

test("rejects an unauthenticated connection even though connecting and pinging succeed", async () => {
  const check = databaseCheck();
  expect(await check.ping()).toEqual({ ok: 1 });
  check.listDatabases.mockRejectedValue(new Error("command listDatabases requires authentication"));
  await check.run();
  expect(check.client.connect).toHaveBeenCalled();
  expect(check.output.log).not.toHaveBeenCalled();
  expect(check.output.error).toHaveBeenCalledWith("command listDatabases requires authentication");
  expect(check.process.exitCode).toBe(1);
  expect(check.client.close).toHaveBeenCalled();
});

test("rejects an account that can browse databases but cannot load admin server status", async () => {
  const check = databaseCheck();
  check.serverStatus.mockRejectedValue(
    new Error("user is not allowed to do action [serverStatus] on [admin.]"),
  );
  await check.run();
  expect(check.collections.mock.calls).toEqual([["app"], ["other"]]);
  expect(check.output.log).not.toHaveBeenCalled();
  expect(check.process.exitCode).toBe(1);
  expect(check.client.close).toHaveBeenCalled();
});

test("checks collection access for every database returned to Mongo Express", async () => {
  const check = databaseCheck();
  check.collections
    .mockResolvedValueOnce([])
    .mockRejectedValueOnce(new Error("not authorized on other"));
  await check.run();
  expect(check.process.exitCode).toBe(1);
  expect(check.output.error).toHaveBeenCalledWith("not authorized on other");
  expect(check.output.log).not.toHaveBeenCalled();
});

test("scoped browsing succeeds without permission to run admin commands", async () => {
  const check = databaseCheck(true);
  check.listDatabases.mockRejectedValue(new Error("not authorized"));
  check.serverStatus.mockRejectedValue(new Error("not authorized"));
  await check.run();
  expect(check.collections).toHaveBeenCalledWith("app");
  expect(check.listDatabases).not.toHaveBeenCalled();
  expect(check.serverStatus).not.toHaveBeenCalled();
  expect(check.process.exitCode).toBe(0);
  expect(check.output.log).toHaveBeenCalledWith(CONNECTION_TEST_SUCCESSFUL_MESSAGE);
  expect(check.client.close).toHaveBeenCalled();
});

test("scoped browsing still requires access to its collections", async () => {
  const check = databaseCheck(true);
  check.collections.mockRejectedValue(new Error("not authorized on app"));
  await check.run();
  expect(check.process.exitCode).toBe(1);
  expect(check.output.log).not.toHaveBeenCalled();
});

test("accepts an account with all permissions needed by the admin home page", async () => {
  const check = databaseCheck();
  await check.run();
  expect(check.serverStatus).toHaveBeenCalled();
  expect(check.output.log).toHaveBeenCalledWith(CONNECTION_TEST_SUCCESSFUL_MESSAGE);
  expect(check.process.exitCode).toBe(0);
  expect(check.client.close).toHaveBeenCalled();
});
