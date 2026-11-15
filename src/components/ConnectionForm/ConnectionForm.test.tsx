import React, { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Alert, Button, Dialog, IconButton, RadioGroup, TextField } from "@mui/material";
import { testMongoConnection } from "../../api/docker";
import { ddClient } from "../../api/utils";
import type { MongoConnection } from "../../types/MongoConnection";
import { ConnectionForm } from "./ConnectionForm";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: jest.fn(),
}));
jest.mock("../../api/docker", () => ({ testMongoConnection: jest.fn() }));
jest.mock("../../api/utils", () => ({ ddClient: { host: { openExternal: jest.fn() } } }));

function findElements(node: ReactNode, type: ReactElement["type"]): ReactElement[] {
  const found: ReactElement[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === type) found.push(child);
    found.push(...findElements(child.props.children, type));
  });
  return found;
}

let state: unknown[];
let cursor: number;
const useStateMock = React.useState as jest.Mock;
const testConnection = testMongoConnection as jest.Mock;

function render(props: React.ComponentProps<typeof ConnectionForm>): ReactElement {
  cursor = 0;
  return ConnectionForm(props);
}

beforeEach(() => {
  state = [];
  cursor = 0;
  jest.clearAllMocks();
  useStateMock.mockImplementation((initial: unknown) => {
    const index = cursor++;
    if (!(index in state))
      state[index] = typeof initial === "function" ? (initial as () => unknown)() : initial;
    return [
      state[index],
      (value: unknown) => {
        state[index] =
          typeof value === "function"
            ? (value as (previous: unknown) => unknown)(state[index])
            : value;
      },
    ];
  });
});

test("starts with basic connection fields and prevents saving a blank name", () => {
  const tree = render({ open: true, onClose: jest.fn(), onSave: jest.fn() });

  expect(tree.type).toBe(Dialog);
  expect(tree.props.open).toBe(true);
  expect(findElements(tree, TextField).map((field) => field.props.label)).toEqual([
    "Connection name",
    "Hostname",
    "Port",
    "Username (optional)",
    "Password (optional)",
  ]);
  expect(
    findElements(tree, Button).find((button) => button.props.type === "submit")?.props.disabled,
  ).toBe(true);
});

test("submits a trimmed connection and preserves its id when editing", () => {
  const connection: MongoConnection = {
    id: "existing-id",
    name: "Old name",
    authMethod: "basic",
    hostname: "  db.example  ",
    port: 27018,
    connectionString: "mongodb://localhost:27017",
    username: "user",
    password: "secret",
    tls: { enabled: false },
  };
  const onSave = jest.fn();
  const props = { open: true, connection, onClose: jest.fn(), onSave };
  let tree = render(props);
  const name = findElements(tree, TextField).find(
    (field) => field.props.label === "Connection name",
  )!;
  name.props.onChange({ target: { value: "  Production  " } });
  tree = render(props);
  const form = findElements(tree, "form")[0];
  form.props.onSubmit({ preventDefault: jest.fn() });

  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "existing-id",
      name: "Production",
      hostname: "db.example",
      port: 27018,
      tls: {
        enabled: false,
        caFile: undefined,
        certificateKeyFile: undefined,
        allowInvalidHostnames: false,
      },
    }),
  );
});

test("reveals connection-string fields and disables save for invalid settings", () => {
  const props = { open: true, onClose: jest.fn(), onSave: jest.fn() };
  let tree = render(props);
  const radioGroup = findElements(tree, RadioGroup)[0];
  radioGroup.props.onChange({ target: { value: "connectionString" } });
  tree = render(props);
  expect(
    findElements(tree, TextField).some(
      (field) => field.props.label === "MongoDB connection string",
    ),
  ).toBe(true);

  const stringField = findElements(tree, TextField).find(
    (field) => field.props.label === "MongoDB connection string",
  )!;
  stringField.props.onChange({ target: { value: "not-a-mongodb-url" } });
  tree = render(props);
  expect(
    findElements(tree, Alert).some((alert) =>
      String(alert.props.children).includes("valid mongodb://"),
    ),
  ).toBe(true);
  expect(
    findElements(tree, Button).find((button) => button.props.type === "submit")?.props.disabled,
  ).toBe(true);
});

test("tests a connection and displays failures; opens the usage guide", async () => {
  const props = { open: true, onClose: jest.fn(), onSave: jest.fn() };
  let tree = render(props);
  const testButton = findElements(tree, Button).find(
    (button) => button.props.children === "Test connection",
  )!;
  testConnection.mockRejectedValue(new Error("refused"));
  await testButton.props.onClick();
  tree = render(props);
  expect(findElements(tree, Alert).map((alert) => alert.props.children)).toContain(
    "Connection failed: refused",
  );

  const helpButton = findElements(tree, IconButton).find(
    (button) => button.props["aria-label"] === "Open usage guide in browser",
  )!;
  helpButton.props.onClick();
  expect(ddClient.host.openExternal).toHaveBeenCalledWith(
    "https://github.com/Saniewski/mongo-express-docker-extension#usage",
  );
});
