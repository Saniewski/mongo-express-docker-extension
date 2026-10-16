import { createDockerDesktopClient } from "@docker/extension-api-client";

export const ddClient = createDockerDesktopClient();
export const ddToast =
  ddClient.desktopUI.toast ??
  (new Proxy(
    {},
    {
      get(_target, prop: string) {
        switch (prop) {
          case "error":
            return console.error;
          case "warning":
            return console.warn;
          default:
            return console.log;
        }
      },
    },
  ) as NonNullable<typeof ddClient.desktopUI.toast>);
