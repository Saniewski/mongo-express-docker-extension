import { Box, Grid, LinearProgress, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ddToast } from "../api/utils";
import { checkMongoExpressStatus, removeMongoExpress, startMongoExpress } from "../api/docker";
import { ServiceUnavailable } from "../components/ServiceUnavailable/ServiceUnavailable";
import { ExtensionConfig } from "../types/ExtensionConfig";

export const MongoExpressPage = () => {
  const [isLoading, setLoading] = useState(true);
  const [isReady, setReady] = useState(false);

  const location = useLocation();
  const extensionConfig: ExtensionConfig = location.state.extensionConfig;

  useEffect(() => {
    if (isLoading) {
      document.body.classList.add('full-screen-body');
      document.getElementById('root')?.classList.add('full-screen-root');
      startMongoExpress(extensionConfig)
        .then(() => {
          let retries = 30;
          let timer = setInterval(() => {
            if (retries === 0) {
              clearInterval(timer);
              ddToast.error('Mongo Express failed to start after 30 seconds.');
              setLoading(false);
            }
            checkMongoExpressStatus()
              .then((status) => {
                if (status === 'up') {
                  setReady(true);
                  setLoading(false);
                  document.body.classList.add('full-screen-body');
                  document.getElementById('root')?.classList.add('full-screen-root');
                  clearInterval(timer);
                }
                retries--;
              })
              .catch((error) => {
                ddToast.error(error.toString());
              });
          }, 1000);
        })
        .catch((error) => {
          console.error(error.toString());
          ddToast.error(error.toString());
          setLoading(false);
        });
    }

    return () => {
      removeMongoExpress()
        .then(() => {
          document.body.classList.remove('full-screen-body');
          document.getElementById('root')?.classList.remove('full-screen-root');
        })
        .catch((error) => {
          ddToast.error(error.toString());
        });
    };
  }, []);

  return (
    <>
      {isLoading ? (
        <Grid
          container
          flex={1}
          direction="column"
          height="100%"
          justifyContent="center"
          alignItems="center"
          spacing={4}
        >
          <Grid item width="90%">
            <LinearProgress />
          </Grid>
          <Grid item>
            <Typography>Mongo Express is starting...</Typography>
          </Grid>
        </Grid>
      ) : (
        <>
          {!isReady ? (
            <ServiceUnavailable />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flex: 1,
                width: '100%',
                height: '100%',
              }}
            >
              <iframe
                style={{
                  border: 'none',
                  width: '100%',
                  height: '100%',
                }}
                title="Mongo Express Docker Extension"
                src='http://localhost:8081/'
              />
            </Box>
          )}
        </>
      )}
    </>
  );
};
