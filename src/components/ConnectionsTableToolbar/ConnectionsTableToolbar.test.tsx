import { renderToStaticMarkup } from "react-dom/server";
import { ConnectionsTableToolbar } from "./ConnectionsTableToolbar";

test("shows the connections heading and add action", () => {
  const onAddConnection = jest.fn();
  const markup = renderToStaticMarkup(
    <ConnectionsTableToolbar disabled={false} onAddConnection={onAddConnection} />,
  );

  expect(markup).toContain("MongoDB connections");
  expect(markup).toContain("Add connection");
  expect(markup).not.toContain('disabled=""');
});

test("disables the add action when requested", () => {
  const markup = renderToStaticMarkup(
    <ConnectionsTableToolbar disabled onAddConnection={jest.fn()} />,
  );

  expect(markup).toContain('disabled=""');
});
