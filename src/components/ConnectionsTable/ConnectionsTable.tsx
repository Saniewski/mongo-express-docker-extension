import {
  Button,
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
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { getConnectionEndpoint } from "../../api/connections";
import { MongoConnection } from "../../types/MongoConnection";

type ConnectionsTableProps = {
  connections: MongoConnection[];
  isPreparing: boolean;
  onOpen: (connection: MongoConnection) => void;
  onEdit: (connection: MongoConnection) => void;
  onDelete: (connection: MongoConnection) => void;
};

export const ConnectionsTable = ({
  connections,
  isPreparing,
  onOpen,
  onEdit,
  onDelete,
}: ConnectionsTableProps) => (
  <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
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
              {connection.authMethod === "basic" ? "Host and credentials" : "Connection string"}
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                <Button
                  size="small"
                  variant="contained"
                  endIcon={<OpenInNewIcon />}
                  disabled={isPreparing}
                  onClick={() => onOpen(connection)}
                >
                  Open
                </Button>
                <IconButton
                  aria-label={`Edit ${connection.name}`}
                  onClick={() => onEdit(connection)}
                >
                  <EditOutlinedIcon />
                </IconButton>
                <IconButton
                  aria-label={`Delete ${connection.name}`}
                  color="error"
                  onClick={() => onDelete(connection)}
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
);
