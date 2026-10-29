export function getErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string {
  let message = typeof error === "string" ? error : "";
  if (error && typeof error === "object") {
    const details = [
      "stderr" in error ? error.stderr : undefined,
      "message" in error ? error.message : undefined,
    ];
    message =
      details.find((value): value is string => typeof value === "string" && !!value.trim()) ?? "";
  }

  // Docker errors may echo the command, including MongoDB credentials.
  return (message.trim() || fallback).replace(
    /(mongodb(?:\+srv)?:\/\/)[^\s@]+@/gi,
    "$1[redacted]@",
  );
}
