import { Box, Typography } from "@mui/material";
import mongoExpressLogo from "../../assets/mongo-express-logo.png";

export const ExtensionHeader = () => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="h3">Mongo Express</Typography>
      <Box
        component="img"
        src={mongoExpressLogo}
        alt="Mongo Express logo"
        sx={{ width: 36, height: 36, objectFit: "contain" }}
      />
    </Box>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
      Manage saved MongoDB connections and open them in Mongo Express. A Mongo Express container is
      started when you open a connection and removed when you return here.
    </Typography>
  </Box>
);
