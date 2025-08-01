import { Typography } from "@mui/material";
import { ConnectionForm } from "../components/ConnectionForm/ConnectionForm";

export const LoginPage = () => {
  return (
    <>
      <Typography variant="h3">Mongo Express</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }} align="justify">
        This Docker Desktop extension provides a quick way to setup and run Mongo Express client.<br />
        You can use either a basic authentication form consisting of a host address name and port, optional username and
        password, or use a MongoDB connection string. Check "Remember this connection" to save your credentials for
        future use.
      </Typography>

      <ConnectionForm />
    </>
  );
};
