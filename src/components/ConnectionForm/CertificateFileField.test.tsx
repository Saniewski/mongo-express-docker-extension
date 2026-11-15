import React, { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { ddClient, ddToast } from "../../api/utils";
import { CertificateFileField } from "./CertificateFileField";

jest.mock("../../api/utils", () => ({
  ddClient: { desktopUI: { dialog: { showOpenDialog: jest.fn() } } },
  ddToast: { error: jest.fn() },
}));

function findElements(node: ReactNode, type: ReactElement["type"]): ReactElement[] {
  const found: ReactElement[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === type) found.push(child);
    found.push(...findElements(child.props.children, type));
  });
  return found;
}

const showOpenDialog = ddClient.desktopUI.dialog.showOpenDialog as jest.Mock;
const toastError = ddToast.error as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test("renders the controlled certificate path field and forwards edits", () => {
  const onChange = jest.fn();
  const tree = CertificateFileField({
    label: "CA certificate (optional)",
    value: "/certs/ca.pem",
    helperText: "Choose a PEM file",
    onChange,
  });
  const input = findElements(tree, TextField)[0];

  expect(tree.type).toBe(Stack);
  expect(input.props).toMatchObject({
    label: "CA certificate (optional)",
    value: "/certs/ca.pem",
    helperText: "Choose a PEM file",
    placeholder: "/absolute/path/to/certificate.pem",
  });
  input.props.onChange({ target: { value: "/certs/new.pem" } });
  expect(onChange).toHaveBeenCalledWith("/certs/new.pem");
});

test("browses for the selected file and ignores canceled or empty results", async () => {
  const onChange = jest.fn();
  const tree = CertificateFileField({
    label: "CA certificate",
    value: "",
    helperText: "",
    onChange,
  });
  const browse = findElements(tree, Button)[0].props.onClick as () => Promise<void>;

  showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ["/certs/ca.pem"] });
  await browse();
  expect(showOpenDialog).toHaveBeenCalledWith({
    title: "Select ca certificate",
    properties: ["openFile", "showHiddenFiles"],
    filters: [
      { name: "PEM certificates", extensions: ["pem", "crt", "cer", "key"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  expect(onChange).toHaveBeenCalledWith("/certs/ca.pem");

  onChange.mockClear();
  showOpenDialog.mockResolvedValue({ canceled: true, filePaths: ["/ignored.pem"] });
  await browse();
  showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] });
  await browse();
  expect(onChange).not.toHaveBeenCalled();
});

test("reports file picker errors with the user-facing fallback", async () => {
  const browse = findElements(
    CertificateFileField({ label: "Client key", value: "", helperText: "", onChange: jest.fn() }),
    Button,
  )[0].props.onClick as () => Promise<void>;
  showOpenDialog.mockRejectedValue(new Error("Picker unavailable"));

  await browse();

  expect(toastError).toHaveBeenCalledWith("Picker unavailable");
});
