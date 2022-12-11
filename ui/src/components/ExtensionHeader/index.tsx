import React from "react";
import { Typography } from "@mui/material";

const ExtensionHeader = () => {
  return (
    <>
      <Typography variant="h3">Mongo Express</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        This is a Docker extension providing a way to quickly setup and run Mongo Express client.
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        You can use either a basic authentication form consisting of a host address name and port, optional username and
        password, or use a MongoDB connection string. Check "Remember this connection" to save your credentials for
        future use.
      </Typography>
    </>
  );
};

export default ExtensionHeader;
