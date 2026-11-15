import { renderToStaticMarkup } from "react-dom/server";
import { DeletionConfirmationDialog } from "./DeletionConfirmationDialog";
import type { MongoConnection } from "../../types/MongoConnection";

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? children : null,
  };
});

const connection: MongoConnection = {
  id: "connection-1",
  name: "Local MongoDB",
  authMethod: "basic",
};

test("renders the selected connection and confirmation actions", () => {
  const markup = renderToStaticMarkup(
    <DeletionConfirmationDialog
      connection={connection}
      isDeleting={false}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />,
  );

  expect(markup).toContain("Delete connection?");
  expect(markup).toContain("“Local MongoDB” will be removed from your saved connections.");
  expect(markup).toContain("Cancel");
  expect(markup).toContain("Delete");
});

test("hides an unselected dialog and disables actions while deleting", () => {
  const hiddenMarkup = renderToStaticMarkup(
    <DeletionConfirmationDialog isDeleting={false} onClose={jest.fn()} onConfirm={jest.fn()} />,
  );
  expect(hiddenMarkup).not.toContain("Delete connection?");

  const deletingMarkup = renderToStaticMarkup(
    <DeletionConfirmationDialog
      connection={connection}
      isDeleting
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />,
  );
  expect(deletingMarkup.match(/disabled=""/g)).toHaveLength(2);
});
