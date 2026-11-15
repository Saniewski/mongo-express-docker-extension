import { renderToStaticMarkup } from "react-dom/server";
import { ServiceUnavailable } from "./ServiceUnavailable";

jest.mock("../../api/utils", () => ({ ddClient: { host: { openExternal: jest.fn() } } }));
jest.mock("../../assets/mongo-express-logo.png", () => "mongo-express-logo.png");

test("renders the service error and return action without an optional retry", () => {
  const markup = renderToStaticMarkup(
    <ServiceUnavailable message="Docker Desktop is unavailable" onReturn={jest.fn()} />,
  );

  expect(markup).toContain("Service Unavailable");
  expect(markup).toContain("Docker Desktop is unavailable");
  expect(markup).toContain("Back to connections");
  expect(markup).not.toContain("Try again");
  expect(markup).toContain("Report an issue");
  expect(markup).toContain('alt="Mongo Express Logo"');
});

test("includes the retry action when supplied", () => {
  const markup = renderToStaticMarkup(
    <ServiceUnavailable message="Please retry" onReturn={jest.fn()} onRetry={jest.fn()} />,
  );

  expect(markup).toContain("Try again");
});
