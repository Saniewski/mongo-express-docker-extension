import { Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

type ConnectionsTableToolbarProps = {
  disabled: boolean;
  onAddConnection: () => void;
};

export const ConnectionsTableToolbar = ({
  disabled,
  onAddConnection,
}: ConnectionsTableToolbarProps) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={2}
    sx={{ mb: 2, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}
  >
    <Typography variant="h5">MongoDB connections</Typography>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={onAddConnection}
      disabled={disabled}
    >
      Add connection
    </Button>
  </Stack>
);
