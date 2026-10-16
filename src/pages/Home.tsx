import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useNavigate } from "react-router";
import { cleanupMongoExpressContainers, removeMongoExpress } from "../api/docker";
import {
  loadConnections,
  saveConnections,
  createConnectionId,
  getConnectionEndpoint,
} from "../api/connections";
import { ddToast } from "../api/utils";
import { ConnectionForm } from "../components/ConnectionForm/ConnectionForm";
import { ExtensionHeader } from "../components/ExtensionHeader/ExtensionHeader";
import { MongoConnection } from "../types/MongoConnection";

export const HomePage = () => {
  const [connections, setConnections] = useState<MongoConnection[]>(loadConnections);
  const [formOpen, setFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<MongoConnection>();
  const [deletingConnection, setDeletingConnection] = useState<MongoConnection>();
  const [isDeleting, setDeleting] = useState(false);
  const [isPreparing, setPreparing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cleanupMongoExpressContainers()
      .catch((error: unknown) => {
        ddToast.error(error instanceof Error ? error.message : String(error));
      })
      .finally(() => setPreparing(false));
  }, []);

  const openNewConnection = () => {
    setEditingConnection(undefined);
    setFormOpen(true);
  };

  const handleSave = (connection: MongoConnection) => {
    const savedConnection = {
      ...connection,
      id: editingConnection?.id ?? createConnectionId(),
    };
    const updatedConnections = editingConnection
      ? connections.map((item) => (item.id === savedConnection.id ? savedConnection : item))
      : [...connections, savedConnection];

    try {
      saveConnections(updatedConnections);
      setConnections(updatedConnections);
      setFormOpen(false);
      setEditingConnection(undefined);
      ddToast.success(editingConnection ? "Connection updated." : "Connection added.");
    } catch (error) {
      ddToast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingConnection) return;
    setDeleting(true);
    try {
      await removeMongoExpress(deletingConnection.id);
      const updatedConnections = connections.filter((item) => item.id !== deletingConnection.id);
      saveConnections(updatedConnections);
      setConnections(updatedConnections);
      setDeletingConnection(undefined);
      ddToast.success("Connection deleted.");
    } catch (error) {
      ddToast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ExtensionHeader />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}
      >
        <Typography variant="h5">MongoDB connections</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openNewConnection}
          disabled={isPreparing}
        >
          Add connection
        </Button>
      </Stack>

      {isPreparing ? (
        <Alert severity="info" icon={<CircularProgress size={18} />}>
          Cleaning up containers from the previous session…
        </Alert>
      ) : connections.length === 0 ? (
        <Alert severity="info">
          No connections yet. Add a MongoDB connection to start using Mongo Express.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="Configured MongoDB connections">
            <TableHead>
              <TableRow>
                <TableCell>Connection</TableCell>
                <TableCell>MongoDB endpoint</TableCell>
                <TableCell>Authentication</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {connections.map((connection) => (
                <TableRow key={connection.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{connection.name}</Typography>
                  </TableCell>
                  <TableCell>{getConnectionEndpoint(connection)}</TableCell>
                  <TableCell>
                    {connection.authMethod === "basic"
                      ? "Host and credentials"
                      : "Connection string"}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <Button
                        size="small"
                        variant="contained"
                        endIcon={<OpenInNewIcon />}
                        disabled={isPreparing}
                        onClick={() => navigate(`/mongo-express/${connection.id}`)}
                      >
                        Open
                      </Button>
                      <IconButton
                        aria-label={`Edit ${connection.name}`}
                        onClick={() => {
                          setEditingConnection(connection);
                          setFormOpen(true);
                        }}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton
                        aria-label={`Delete ${connection.name}`}
                        color="error"
                        onClick={() => setDeletingConnection(connection)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Mongo Express containers run only while you are viewing a connection. Saved credentials
          are kept in this Docker Desktop extension&apos;s browser storage.
        </Typography>
      </Box>

      <ConnectionForm
        key={formOpen ? (editingConnection?.id ?? "new") : "closed"}
        open={formOpen}
        connection={editingConnection}
        onClose={() => {
          setFormOpen(false);
          setEditingConnection(undefined);
        }}
        onSave={handleSave}
      />

      <Dialog
        open={!!deletingConnection}
        onClose={() => !isDeleting && setDeletingConnection(undefined)}
      >
        <DialogTitle>Delete connection?</DialogTitle>
        <DialogContent>
          {`“${deletingConnection?.name ?? ""}” will be removed from your saved connections.`}
        </DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={() => setDeletingConnection(undefined)}>
            Cancel
          </Button>
          <Button color="error" disabled={isDeleting} onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
