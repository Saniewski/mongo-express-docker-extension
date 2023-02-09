import { Avatar, Box, Button, Container, Stack, Typography } from '@mui/material';
import React from "react";
import mongoExpressLogo from "../../assets/mongo-express-logo.png";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { ddClient } from "../../api/utils";

export const ServiceUnavailable = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Avatar sx={{ m: 1, width: 60, height: 60 }} alt="Mongo Express Logo" src={mongoExpressLogo} />
        <Typography variant="h5">Service Unavailable</Typography>
        <Typography variant="body1" color="text.secondary" mt={2} align="justify">
          Please, make sure the credentials are correct or try again after restarting / reinstalling
          the extension.<br />If the problem persists, please create an issue on the extension's GitHub page.
        </Typography>
        <Stack direction="row" spacing={2} mt={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            variant="contained"
          >
            {"Return to the main page"}
          </Button>
          <Button
            endIcon={<OpenInNewIcon />}
            onClick={() =>
              ddClient?.host?.openExternal('https://github.com/Saniewski/mongo-express-docker-extension/issues/new')}
            variant="outlined"
          >
            {"Report an issue"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};
