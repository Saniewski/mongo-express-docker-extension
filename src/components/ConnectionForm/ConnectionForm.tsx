import { FormEvent, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { MongoConnection } from "../../types/MongoConnection";
import { getConnectionSettingsError } from "../../api/mongoConfig";
import { testMongoConnection } from "../../api/docker";
import { getErrorMessage } from "../../api/errors";
import { CertificateFileField } from "./CertificateFileField";

type ConnectionFormProps = {
  open: boolean;
  connection?: MongoConnection;
  onClose: () => void;
  onSave: (connection: MongoConnection) => void;
};

const emptyConnection: Omit<MongoConnection, "id"> = {
  name: "",
  authMethod: "basic",
  hostname: "localhost",
  port: 27017,
  username: "",
  password: "",
  directConnection: false,
  connectionString: "mongodb://localhost:27017",
  databaseScoped: false,
  databaseName: "",
  tls: { enabled: false },
};

export const ConnectionForm = ({ open, connection, onClose, onSave }: ConnectionFormProps) => {
  const [form, setForm] = useState<Omit<MongoConnection, "id">>(() =>
    connection
      ? {
          name: connection.name,
          authMethod: connection.authMethod,
          hostname: connection.hostname,
          port: connection.port,
          username: connection.username,
          password: connection.password,
          directConnection: connection.directConnection ?? false,
          connectionString: connection.connectionString,
          databaseScoped: connection.databaseScoped ?? false,
          databaseName: connection.databaseName ?? "",
          tls: { ...connection.tls, enabled: connection.tls?.enabled ?? false },
        }
      : { ...emptyConnection },
  );
  const [isTesting, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    form: typeof form;
    severity: "success" | "error";
    message: string;
  }>();

  const settingsError = getConnectionSettingsError(form);
  const canSave = form.name.trim().length > 0 && !settingsError && !isTesting;

  const handleTest = async () => {
    if (settingsError || isTesting) return;
    setTesting(true);
    setTestResult(undefined);
    try {
      await testMongoConnection(form);
      setTestResult({ form, severity: "success", message: "Connection successful." });
    } catch (error) {
      setTestResult({
        form,
        severity: "error",
        message: `Connection failed: ${getErrorMessage(error)}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const updateTls = (settings: Partial<NonNullable<MongoConnection["tls"]>>) => {
    setForm((current) => ({
      ...current,
      tls: { enabled: false, ...current.tls, ...settings },
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    onSave({
      ...form,
      id: connection?.id ?? "",
      name: form.name.trim(),
      port: Number(form.port) || 27017,
      hostname: form.hostname?.trim(),
      connectionString: form.connectionString?.trim(),
      databaseName: form.databaseName?.trim(),
      tls: {
        enabled: form.tls?.enabled ?? false,
        caFile: form.tls?.caFile?.trim(),
        certificateKeyFile: form.tls?.certificateKeyFile?.trim(),
        allowInvalidHostnames: form.tls?.allowInvalidHostnames ?? false,
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <DialogTitle>{connection ? "Edit connection" : "Add MongoDB connection"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              required
              label="Connection name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <RadioGroup
              row
              value={form.authMethod}
              onChange={(event) =>
                setForm({
                  ...form,
                  authMethod: event.target.value as MongoConnection["authMethod"],
                })
              }
            >
              <FormControlLabel value="basic" control={<Radio />} label="Host and credentials" />
              <FormControlLabel
                value="connectionString"
                control={<Radio />}
                label="Connection string"
              />
            </RadioGroup>
            {form.authMethod === "basic" ? (
              <>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    required
                    fullWidth
                    label="Hostname"
                    value={form.hostname ?? ""}
                    onChange={(event) => setForm({ ...form, hostname: event.target.value })}
                  />
                  <TextField
                    required
                    label="Port"
                    type="number"
                    slotProps={{ htmlInput: { min: 1, max: 65535 } }}
                    value={form.port ?? 27017}
                    onChange={(event) => setForm({ ...form, port: Number(event.target.value) })}
                    sx={{ width: { xs: "100%", sm: 140 } }}
                  />
                </Stack>
                <TextField
                  label="Username (optional)"
                  autoComplete="username"
                  value={form.username ?? ""}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                />
                <TextField
                  label="Password (optional)"
                  type="password"
                  autoComplete="current-password"
                  value={form.password ?? ""}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.directConnection ?? false}
                        onChange={(event) =>
                          setForm({ ...form, directConnection: event.target.checked })
                        }
                      />
                    }
                    label="Direct connection"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Connect only to the specified host and port, without automatically
                    discovering other servers.
                  </Typography>
                </Stack>
              </>
            ) : (
              <TextField
                required
                label="MongoDB connection string"
                placeholder="mongodb://user:password@host:27017/database"
                helperText={
                  form.databaseScoped
                    ? "Include the database name, for example mongodb://host:27017/app."
                    : "Use a mongodb:// or mongodb+srv:// connection string."
                }
                value={form.connectionString ?? ""}
                onChange={(event) => setForm({ ...form, connectionString: event.target.value })}
              />
            )}
            <Divider />
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.databaseScoped ?? false}
                    onChange={(event) => setForm({ ...form, databaseScoped: event.target.checked })}
                  />
                }
                label="Database-scoped mode"
              />
              <Typography variant="body2" color="text.secondary">
                Show only the selected database and disable admin features. Database permissions
                still control read and write access.
              </Typography>
              {form.databaseScoped && form.authMethod === "basic" && (
                <TextField
                  required
                  label="Database name"
                  value={form.databaseName ?? ""}
                  onChange={(event) => setForm({ ...form, databaseName: event.target.value })}
                  helperText={
                    form.username
                      ? "Credentials authenticate against admin. Use a connection string for another authentication database."
                      : undefined
                  }
                />
              )}
            </Stack>
            <Divider />
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.tls?.enabled ?? false}
                    onChange={(event) => updateTls({ enabled: event.target.checked })}
                  />
                }
                label="TLS settings"
              />
              <Typography variant="body2" color="text.secondary">
                {form.tls?.enabled
                  ? "TLS is enabled. These settings override certificate and verification options in the connection string. Certificate files stay on your computer and are shared read-only."
                  : "Enable to configure certificates. Otherwise, TLS follows your connection string."}
              </Typography>
              {form.tls?.enabled && (
                <>
                  <CertificateFileField
                    label="CA certificate (optional)"
                    value={form.tls.caFile ?? ""}
                    helperText="PEM file for your certificate authority. Leave empty to use the container's trusted authorities."
                    onChange={(caFile) => updateTls({ caFile })}
                  />
                  <CertificateFileField
                    label="Client certificate/key (optional)"
                    value={form.tls.certificateKeyFile ?? ""}
                    helperText="One PEM file containing the client certificate and private key. Only its path is saved."
                    onChange={(certificateKeyFile) => updateTls({ certificateKeyFile })}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.tls.allowInvalidHostnames ?? false}
                        onChange={(event) =>
                          updateTls({ allowInvalidHostnames: event.target.checked })
                        }
                      />
                    }
                    label="Allow certificate hostname mismatch"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Use only for a trusted local proxy whose certificate names the remote server.
                    Certificate authority verification remains enabled.
                  </Typography>
                </>
              )}
            </Stack>
            {settingsError && <Alert severity="error">{settingsError}</Alert>}
          </Stack>
        </DialogContent>
        {testResult?.form === form && (
          <Alert severity={testResult.severity} sx={{ mx: 3, mb: 2, overflowWrap: "anywhere" }}>
            {testResult.message}
          </Alert>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            type="button"
            onClick={handleTest}
            disabled={!!settingsError || isTesting}
            loading={isTesting}
            sx={{ mr: "auto" }}
          >
            {isTesting ? "Testing…" : "Test connection"}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!canSave}>
            {connection ? "Save changes" : "Add connection"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
