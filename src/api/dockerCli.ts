import type { v1 } from "@docker/extension-api-client-types";
import { ddClient } from "./utils";
import { getErrorMessage } from "./errors";

export function dockerExec(command: string, args: string[]): Promise<v1.RawExecResult> {
  // Non-streaming SDK exec joins arguments into a shell command. Streaming exec
  // passes them directly to Docker, preserving URI queries and Go templates.
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const onError = (error: unknown) => {
      reject(new Error(getErrorMessage(error, `Failed to run docker ${command}.`)));
    };

    try {
      ddClient.docker.cli.exec(command, args, {
        stream: {
          onOutput(data) {
            stdout += data.stdout ?? "";
            stderr += data.stderr ?? "";
          },
          onError,
          onClose(code) {
            resolve({ code, stdout, stderr });
          },
        },
      });
    } catch (error) {
      onError(error);
    }
  });
}
