import { useEffect, useState } from "react";
import { Alert, CircularProgress, Container } from "@mui/material";
import { useNavigate } from "react-router";
import { cleanupMongoExpressContainers, removeMongoExpress } from "../api/docker";
import {
  loadConnections,
  saveConnections,
  createConnectionId,
} from "../api/connections";
import { ddToast } from "../api/utils";
import { ConnectionForm } from "../components/ConnectionForm/ConnectionForm";
import { ExtensionHeader } from "../components/ExtensionHeader/ExtensionHeader";
import { ExtensionFooter } from "../components/ExtensionFooter/ExtensionFooter";
import { ConnectionsTable } from "../components/ConnectionsTable/ConnectionsTable";
import { ConnectionsTableToolbar } from "../components/ConnectionsTableToolbar/ConnectionsTableToolbar";
import { DeletionConfirmationDialog } from "../components/DeletionConfirmationDialog/DeletionConfirmationDialog";
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
    <Container
      maxWidth="xl"
      sx={{
        px: { xs: 0 },
        // Docker Desktop overlays its status bar at the bottom of the extension viewport.
        height: "calc(100vh - 32px)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <ExtensionHeader />
      <ConnectionsTableToolbar disabled={isPreparing} onAddConnection={openNewConnection} />

      {isPreparing ? (
        <Alert severity="info" icon={<CircularProgress size={18} />}>
          Cleaning up containers from the previous session…
        </Alert>
      ) : connections.length === 0 ? (
        <Alert severity="info">
          No connections yet. Add a MongoDB connection to start using Mongo Express.
        </Alert>
      ) : (
        <ConnectionsTable
          connections={connections}
          isPreparing={isPreparing}
          onOpen={(connection) => navigate(`/mongo-express/${connection.id}`)}
          onEdit={(connection) => {
            setEditingConnection(connection);
            setFormOpen(true);
          }}
          onDelete={setDeletingConnection}
        />
      )}

      <ExtensionFooter />

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

      <DeletionConfirmationDialog
        connection={deletingConnection}
        isDeleting={isDeleting}
        onClose={() => setDeletingConnection(undefined)}
        onConfirm={handleDelete}
      />
    </Container>
  );
};
