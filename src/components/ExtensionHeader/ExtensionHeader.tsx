import { Box, Typography } from "@mui/material";

export const ExtensionHeader = () => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h3">Mongo Express</Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
      Manage saved MongoDB connections and open them in Mongo Express. A Mongo Express container is
      started when you open a connection and removed when you return here.
    </Typography>
  </Box>
);
