import { useEffect, useMemo, useState } from "react";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router";
import { checkMongoExpress, removeMongoExpress, startMongoExpress } from "../api/docker";
import { loadConnections } from "../api/connections";
import { ddToast } from "../api/utils";
import { ServiceUnavailable } from "../components/ServiceUnavailable/ServiceUnavailable";

const STARTUP_TIMEOUT_MS = 60_000;

export const MongoExpressPage = () => {
  const { connectionId } = useParams();
  const navigate = useNavigate();
  const connection = useMemo(
    () => loadConnections().find((item) => item.id === connectionId),
    [connectionId],
  );
  const [isLoading, setLoading] = useState(true);
  const [isReady, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mongoExpressUrl, setMongoExpressUrl] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    document.body.classList.add("full-screen-body");
    document.getElementById("root")?.classList.add("full-screen-root");

    if (!connection || !connectionId) {
      return () => {
        document.body.classList.remove("full-screen-body");
        document.getElementById("root")?.classList.remove("full-screen-root");
      };
    }

    let cancelled = false;
    let timedOut = false;
    let timeoutId = 0;
    const deadline = Date.now() + STARTUP_TIMEOUT_MS;
    const launchId = crypto.randomUUID();
    const startupTask = startMongoExpress(connection, launchId);

    // If the Docker CLI finishes after the UI timeout or after navigating away, remove any
    // container it may have created in the meantime.
    void startupTask
      .then(() => {
        if (cancelled || timedOut) {
          return removeMongoExpress(connection.id, launchId);
        }
      })
      .catch(() => undefined);

    const startupFlow = async () => {
      const port = await startupTask;
      if (cancelled || timedOut) return;

      setMongoExpressUrl(`http://127.0.0.1:${port}/`);
      while (!cancelled && !timedOut && Date.now() < deadline) {
        const status = await checkMongoExpress(connection.id, launchId);
        if (cancelled || timedOut) return;
        if (status === "up") {
          setReady(true);
          setLoading(false);
          return;
        }
        if (status === "exited") {
          throw new Error("Mongo Express stopped unexpectedly. Check the connection details.");
        }
        await wait(Math.min(1000, Math.max(0, deadline - Date.now())));
      }

      if (!cancelled && !timedOut) {
        throw new Error("Mongo Express did not become ready within 60 seconds.");
      }
    };

    const startupTimeout = new Promise<never>((_resolve, reject) => {
      timeoutId = window.setTimeout(() => {
        timedOut = true;
        reject(new Error("Mongo Express did not become ready within 60 seconds."));
      }, STARTUP_TIMEOUT_MS);
    });

    void Promise.race([startupFlow(), startupTimeout])
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : String(error));
          setLoading(false);
          removeMongoExpress(connection.id, launchId).catch((cleanupError: unknown) => {
            console.error("Failed to remove Mongo Express container", cleanupError);
          });
        }
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      removeMongoExpress(connection.id, launchId).catch((error: unknown) => {
        console.error("Failed to remove Mongo Express container", error);
        ddToast.error(error instanceof Error ? error.message : String(error));
      });
      document.body.classList.remove("full-screen-body");
      document.getElementById("root")?.classList.remove("full-screen-root");
    };
  }, [connection, connectionId, attempt]);

  const pageError =
    !connection || !connectionId
      ? "This saved MongoDB connection could not be found."
      : errorMessage;
  const retry = () => {
    setErrorMessage("");
    setLoading(true);
    setReady(false);
    setMongoExpressUrl("");
    setAttempt((current) => current + 1);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          px: 2,
          py: 1,
          minHeight: 56,
          borderBottom: 1,
          borderColor: "divider",
          alignItems: "center",
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")}>
          Connections
        </Button>
        <Typography variant="subtitle1" noWrap>
          {connection?.name ?? "Mongo Express"}
        </Typography>
      </Stack>

      {pageError ? (
        <ServiceUnavailable
          message={pageError}
          onReturn={() => navigate("/")}
          onRetry={connection ? retry : undefined}
        />
      ) : isLoading ? (
        <Box
          sx={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 3,
            px: 4,
          }}
        >
          <Box sx={{ width: "min(600px, 90%)" }}>
            <LinearProgress />
          </Box>
          <Typography>Starting Mongo Express…</Typography>
        </Box>
      ) : isReady ? (
        <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
          <iframe
            style={{ border: "none", width: "100%", height: "100%" }}
            title={`Mongo Express - ${connection?.name ?? "MongoDB"}`}
            src={mongoExpressUrl}
          />
        </Box>
      ) : null}
    </Box>
  );
};

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
