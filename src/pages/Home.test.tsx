/** @jest-environment jsdom */

import React from "react";
import { render, waitFor } from "@testing-library/react";
import { HomePage } from "./Home";
import { loadConnections } from "../api/connections";
import { cleanupMongoExpressContainers } from "../api/docker";

jest.mock("react-router", () => ({ useNavigate: () => jest.fn() }));
jest.mock("../api/docker", () => ({
  cleanupMongoExpressContainers: jest.fn(() => Promise.resolve()),
  removeMongoExpress: jest.fn(() => Promise.resolve()),
}));
jest.mock("../api/connections", () => ({
  loadConnections: jest.fn(() => []),
  saveConnections: jest.fn(),
  createConnectionId: jest.fn(() => "created-id"),
}));
jest.mock("../api/utils", () => ({ ddToast: { error: jest.fn(), success: jest.fn() } }));
jest.mock("../components/ExtensionHeader/ExtensionHeader", () => ({ ExtensionHeader: () => null }));
jest.mock("../components/ExtensionFooter/ExtensionFooter", () => ({ ExtensionFooter: () => null }));
jest.mock("../components/ConnectionsTable/ConnectionsTable", () => ({
  ConnectionsTable: ({
    connections,
  }: {
    connections: { name: string; hostname?: string; port?: number }[];
  }) =>
    React.createElement(
      "div",
      null,
      ...connections.map((connection) =>
        React.createElement(
          "div",
          { key: connection.name },
          `${connection.name} ${connection.hostname ?? ""}${connection.port ? `:${connection.port}` : ""}`,
        ),
      ),
    ),
}));
jest.mock("../components/ConnectionsTableToolbar/ConnectionsTableToolbar", () => ({
  ConnectionsTableToolbar: ({ disabled }: { disabled: boolean }) =>
    React.createElement("button", { disabled }, "Add connection"),
}));
jest.mock("../components/ConnectionForm/ConnectionForm", () => ({ ConnectionForm: () => null }));
jest.mock("../components/DeletionConfirmationDialog/DeletionConfirmationDialog", () => ({
  DeletionConfirmationDialog: () => null,
}));

beforeEach(() => {
  jest.mocked(loadConnections).mockClear().mockReturnValue([]);
  jest.mocked(cleanupMongoExpressContainers).mockReset().mockResolvedValue(undefined);
});

test("shows cleanup progress and disables adding connections while preparing", () => {
  const { container } = render(<HomePage />);

  expect(container.textContent).toContain("Cleaning up containers from the previous session");
  expect(container.querySelector("button")?.hasAttribute("disabled")).toBe(true);
});

test("shows the empty state before cleanup has completed", () => {
  jest.mocked(cleanupMongoExpressContainers).mockImplementation(() => new Promise(() => {}));

  const { container } = render(<HomePage />);

  expect(container.textContent).toContain("Cleaning up containers from the previous session");
  expect(container.textContent).not.toContain("No connections yet.");
});

test("runs cleanup on mount and shows the empty state after cleanup completes", async () => {
  render(<HomePage />);

  expect(cleanupMongoExpressContainers).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(document.body.textContent).toContain("No connections yet."));
});

test("loads saved connections to initialize the page", () => {
  jest.mocked(loadConnections).mockReturnValue([
    {
      id: "saved-id",
      name: "Development MongoDB",
      authMethod: "basic",
      hostname: "localhost",
    },
  ]);

  render(<HomePage />);

  expect(loadConnections).toHaveBeenCalledTimes(1);
});
