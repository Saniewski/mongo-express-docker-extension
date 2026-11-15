/** @jest-environment jsdom */

import React from "react";
import { render, waitFor } from "@testing-library/react";
import { MongoExpressPage } from "./MongoExpress";
import { loadConnections } from "../api/connections";
import { checkMongoExpress, removeMongoExpress, startMongoExpress } from "../api/docker";

jest.mock("react-router", () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ connectionId: "saved-id" }),
}));
jest.mock("../api/connections", () => ({ loadConnections: jest.fn(() => []) }));
jest.mock("../api/docker", () => ({
  checkMongoExpress: jest.fn(),
  removeMongoExpress: jest.fn(() => Promise.resolve()),
  startMongoExpress: jest.fn(() => Promise.resolve(49152)),
}));
jest.mock("../api/utils", () => ({ ddToast: { error: jest.fn() } }));
jest.mock("../components/ServiceUnavailable/ServiceUnavailable", () => ({
  ServiceUnavailable: ({ message }: { message: string }) => <div>{message}</div>,
}));

const connection = {
  id: "saved-id",
  name: "Development MongoDB",
  authMethod: "basic" as const,
  hostname: "localhost",
};

beforeEach(() => {
  jest.mocked(loadConnections).mockReturnValue([connection]);
  jest.mocked(startMongoExpress).mockReset().mockResolvedValue(49152);
  jest.mocked(checkMongoExpress).mockReset().mockResolvedValue("up");
  jest.mocked(removeMongoExpress).mockReset().mockResolvedValue(undefined);
});

test("shows the saved connection name and starts in the loading state", () => {
  jest.mocked(startMongoExpress).mockReturnValue(new Promise(() => {}));
  const { container } = render(<MongoExpressPage />);

  expect(container.textContent).toContain("Development MongoDB");
  expect(container.textContent).toContain("Starting Mongo Express…");
  expect(startMongoExpress).toHaveBeenCalledWith(connection, expect.any(String));
});

test("starts Mongo Express, checks readiness, and renders the ready iframe", async () => {
  jest.mocked(checkMongoExpress).mockResolvedValue("up");
  const { container, unmount } = render(<MongoExpressPage />);

  await waitFor(() => expect(container.querySelector("iframe")).not.toBeNull());

  expect(startMongoExpress).toHaveBeenCalledWith(connection, expect.any(String));
  expect(checkMongoExpress).toHaveBeenCalledWith(connection.id, expect.any(String));
  expect(container.querySelector("iframe")?.getAttribute("src")).toBe("http://127.0.0.1:49152/");
  unmount();
  expect(removeMongoExpress).toHaveBeenCalledWith(connection.id, expect.any(String));
});

test("shows a missing-connection error and offers no retry for an unknown saved connection", () => {
  jest.mocked(loadConnections).mockReturnValue([]);

  const { container } = render(<MongoExpressPage />);

  expect(container.textContent).toContain("This saved MongoDB connection could not be found.");
  expect(container.textContent).not.toContain("Try again");
  expect(startMongoExpress).not.toHaveBeenCalled();
});
