import { FormEvent, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from "@mui/material";
import { MongoConnection } from "../../types/MongoConnection";

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
  connectionString: "mongodb://localhost:27017",
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
          connectionString: connection.connectionString,
        }
      : { ...emptyConnection },
  );

  const canSave =
    form.name.trim().length > 0 &&
    (form.authMethod === "basic"
      ? !!form.hostname?.trim() && Number(form.port) > 0 && Number(form.port) <= 65535
      : isValidConnectionString(form.connectionString ?? ""));

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
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
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
              </>
            ) : (
              <TextField
                required
                label="MongoDB connection string"
                placeholder="mongodb://user:password@host:27017/database"
                error={
                  !!form.connectionString?.trim() && !isValidConnectionString(form.connectionString)
                }
                helperText="Use a valid mongodb:// or mongodb+srv:// connection string."
                value={form.connectionString ?? ""}
                onChange={(event) => setForm({ ...form, connectionString: event.target.value })}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!canSave}>
            {connection ? "Save changes" : "Add connection"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

function isValidConnectionString(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return (
      (parsed.protocol === "mongodb:" || parsed.protocol === "mongodb+srv:") && !!parsed.hostname
    );
  } catch {
    return false;
  }
}
