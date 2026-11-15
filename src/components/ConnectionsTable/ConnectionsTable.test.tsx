import React, { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Button, IconButton, Table, TableBody, TableCell } from "@mui/material";
import type { MongoConnection } from "../../types/MongoConnection";
import { ConnectionsTable } from "./ConnectionsTable";

function findElements(node: ReactNode, type: ReactElement["type"]): ReactElement[] {
  const found: ReactElement[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === type) found.push(child);
    found.push(...findElements(child.props.children, type));
  });
  return found;
}

const basic: MongoConnection = {
  id: "basic-id",
  name: "Local database",
  authMethod: "basic",
  hostname: "localhost",
  port: 27017,
};
const uri: MongoConnection = {
  id: "uri-id",
  name: "Remote cluster",
  authMethod: "connectionString",
  connectionString: "mongodb://user:secret@db.example:27018/app",
};

test("shows connection endpoints and authentication types without exposing URI credentials", () => {
  const tree = ConnectionsTable({
    connections: [basic, uri],
    isPreparing: false,
    onOpen: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  });

  expect(findElements(tree, Table).map((table) => table.props["aria-label"])).toEqual([
    "Configured MongoDB connections",
  ]);
  const text = findElements(tree, TableCell)
    .flatMap((cell) => [
      cell.props.children,
      isValidElement(cell.props.children) ? cell.props.children.props.children : null,
    ])
    .filter((child) => typeof child === "string");
  expect(text).toEqual(
    expect.arrayContaining([
      "Local database",
      "localhost:27017",
      "Host and credentials",
      "Remote cluster",
      "db.example:27018",
      "Connection string",
    ]),
  );
  expect(JSON.stringify(tree)).not.toContain("secret");
});

test("disables opening while preparing and routes each row action to its connection", () => {
  const onOpen = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const tree = ConnectionsTable({
    connections: [basic, uri],
    isPreparing: true,
    onOpen,
    onEdit,
    onDelete,
  });
  const openButtons = findElements(tree, Button).filter(
    (button) => button.props.children === "Open",
  );
  expect(openButtons).toHaveLength(2);
  expect(openButtons.every((button) => button.props.disabled)).toBe(true);
  openButtons[0].props.onClick();

  findElements(tree, IconButton)
    .find((button) => button.props["aria-label"] === "Edit Local database")!
    .props.onClick();
  findElements(tree, IconButton)
    .find((button) => button.props["aria-label"] === "Delete Remote cluster")!
    .props.onClick();

  expect(onOpen).toHaveBeenCalledWith(basic);
  expect(onEdit).toHaveBeenCalledWith(basic);
  expect(onDelete).toHaveBeenCalledWith(uri);
  expect(findElements(tree, TableBody)).toHaveLength(1);
});

test("renders an empty table when there are no connections", () => {
  const tree = ConnectionsTable({
    connections: [],
    isPreparing: false,
    onOpen: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  });

  expect(findElements(tree, TableBody)[0].props.children).toEqual([]);
});
