import { Avatar, Box, Button, Container, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import mongoExpressLogo from "../../assets/mongo-express-logo.png";
import { ddClient } from "../../api/utils";

type ServiceUnavailableProps = {
  message: string;
  onReturn: () => void;
  onRetry?: () => void;
};

export const ServiceUnavailable = ({ message, onReturn, onRetry }: ServiceUnavailableProps) => (
  <Container component="main" maxWidth="sm">
    <Box
      sx={{
        mt: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Avatar
        sx={{ m: 1, width: 60, height: 60 }}
        alt="Mongo Express Logo"
        src={mongoExpressLogo}
      />
      <Typography variant="h5">Service Unavailable</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onReturn} variant="contained">
          Back to connections
        </Button>
        {onRetry && (
          <Button startIcon={<RefreshIcon />} onClick={onRetry} variant="outlined">
            Try again
          </Button>
        )}
        <Button
          endIcon={<OpenInNewIcon />}
          onClick={() =>
            ddClient.host.openExternal(
              "https://github.com/Saniewski/mongo-express-docker-extension/issues/new",
            )
          }
          variant="outlined"
        >
          Report an issue
        </Button>
      </Stack>
    </Box>
  </Container>
);
