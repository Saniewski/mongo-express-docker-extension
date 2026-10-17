import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { MongoConnection } from "../../types/MongoConnection";

type DeletionConfirmationDialogProps = {
  connection?: MongoConnection;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeletionConfirmationDialog = ({
  connection,
  isDeleting,
  onClose,
  onConfirm,
}: DeletionConfirmationDialogProps) => (
  <Dialog open={!!connection} onClose={() => !isDeleting && onClose()}>
    <DialogTitle>Delete connection?</DialogTitle>
    <DialogContent>
      {`“${connection?.name ?? ""}” will be removed from your saved connections.`}
    </DialogContent>
    <DialogActions>
      <Button disabled={isDeleting} onClick={onClose}>
        Cancel
      </Button>
      <Button color="error" disabled={isDeleting} onClick={onConfirm}>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);
