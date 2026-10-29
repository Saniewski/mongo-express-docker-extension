import { getErrorMessage } from "./errors";

test.each([
  [new Error("Connection failed"), "Connection failed"],
  [{ stderr: "No such container", code: 1 }, "No such container"],
  [{ message: "Docker Desktop is unavailable" }, "Docker Desktop is unavailable"],
  [{ stderr: "  ", message: "Permission denied" }, "Permission denied"],
  ["Timeout", "Timeout"],
  [{ code: 1 }, "An unexpected error occurred."],
  [null, "An unexpected error occurred."],
])("extracts readable messages from %p", (error, expected) => {
  expect(getErrorMessage(error)).toBe(expected);
});

test("redacts credentials if Docker echoes a MongoDB URL", () => {
  expect(
    getErrorMessage({
      stderr: "Failed: mongodb://testuser:secret@localhost:27017/?authSource=admin",
    }),
  ).toBe("Failed: mongodb://[redacted]@localhost:27017/?authSource=admin");
});
