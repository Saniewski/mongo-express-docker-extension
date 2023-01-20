import { createDockerDesktopClient } from "@docker/extension-api-client";

export const ddClient = createDockerDesktopClient();
export const ddToast: any = ddClient.desktopUI.toast ??
  new Proxy(
    {},
    {
      get({}, prop) {
        switch (prop) {
          case 'error':
            return console.error;
          case 'warning':
            return console.warn;
          default:
            return console.log;
        }
      },
    }
  );
