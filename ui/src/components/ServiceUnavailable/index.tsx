import { Avatar, Box, Button, Grid, Typography } from '@mui/material';
import React from "react";
import mongoExpressLogo from "../../assets/mongo-express-logo.png";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { ddClient } from "../../api/utils";

const ServiceUnavailable = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        marginTop: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Avatar sx={{ m: 1, width: 60, height: 60 }} alt="Mongo Express Logo" src={mongoExpressLogo} />
      <Typography variant="h5">Service Unavailable</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Please, make sure the credentials are correct or try again after restarting / reinstalling the extension.
        If the problem persists, please create an issue on the extension's GitHub page.
      </Typography>
      <Grid container>
        <Grid item xs>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            variant="contained"
          >
            {"Return to the main page"}
          </Button>
        </Grid>
        <Grid item>
          <Button
            onClick={() =>
              ddClient?.host?.openExternal('https://github.com/Saniewski/mongo-express-docker-extension/issues/new')}
            variant="outlined"
          >
            {"Report an issue"}
            <OpenInNewIcon fontSize="inherit" />
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServiceUnavailable;