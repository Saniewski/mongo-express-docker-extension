import type { MongoConnection } from "../types/MongoConnection";
import { getConnectionEndpoint, loadConnections, saveConnections } from "./connections";

const storageKey = "mongo-express.connections.v1";
let storage: { getItem: jest.Mock; setItem: jest.Mock };

beforeEach(() => {
  storage = { getItem: jest.fn(), setItem: jest.fn() };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

test("loads valid saved connections and ignores malformed entries", () => {
  const connection: MongoConnection = {
    id: "saved",
    name: "Saved connection",
    authMethod: "basic",
    hostname: "localhost",
  };
  storage.getItem.mockReturnValue(
    JSON.stringify([
      connection,
      { id: "missing-name", authMethod: "basic" },
      null,
      { id: "wrong-auth", name: "Invalid", authMethod: "other" },
    ]),
  );

  expect(loadConnections()).toEqual([connection]);
  expect(storage.getItem).toHaveBeenCalledWith(storageKey);
});

test.each([null, "", "not JSON", JSON.stringify({ id: "not-an-array" })])(
  "returns no connections for invalid saved data: %s",
  (saved) => {
    storage.getItem.mockReturnValue(saved);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(loadConnections()).toEqual([]);
    jest.restoreAllMocks();
  },
);

test("saves connections as JSON under the storage key", () => {
  const connections: MongoConnection[] = [
    { id: "saved", name: "Saved", authMethod: "basic", hostname: "localhost" },
  ];

  saveConnections(connections);

  expect(storage.setItem).toHaveBeenCalledWith(storageKey, JSON.stringify(connections));
});

test("gets connection endpoints without exposing credentials or database names", () => {
  expect(
    getConnectionEndpoint({
      id: "saved",
      name: "Saved",
      authMethod: "connectionString",
      connectionString: "mongodb://user:secret@db.example:27018/app?authSource=admin",
    }),
  ).toBe("db.example:27018");
  expect(
    getConnectionEndpoint({
      id: "host",
      name: "Host",
      authMethod: "basic",
      hostname: "localhost",
      port: 27017,
    }),
  ).toBe("localhost:27017");
  expect(getConnectionEndpoint({ id: "bad", name: "Bad", authMethod: "connectionString" })).toBe(
    "Invalid connection string",
  );
});
