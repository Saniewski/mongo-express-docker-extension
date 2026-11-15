import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
  jest.mocked(checkMongoExpress).mockReset();
  jest.mocked(removeMongoExpress).mockReset().mockResolvedValue(undefined);
});

test("shows the saved connection name and startup state", () => {
  const html = renderToStaticMarkup(<MongoExpressPage />);

  expect(html).toContain("Development MongoDB");
  expect(html).toContain("Starting Mongo Express");
  expect(startMongoExpress).not.toHaveBeenCalled();
});

test("shows a missing-connection error and offers no retry for an unknown saved connection", () => {
  jest.mocked(loadConnections).mockReturnValue([]);

  const html = renderToStaticMarkup(<MongoExpressPage />);

  expect(html).toContain("This saved MongoDB connection could not be found.");
  expect(html).not.toContain("Try again");
  expect(startMongoExpress).not.toHaveBeenCalled();
});
