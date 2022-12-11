import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { LoadConfig } from "../utils/config";
import { ddToast } from "../api/utils";
import Loader from "../components/Loader";
import { checkMongoExpressStatus, startMongoExpress } from "../api/docker";
import ServiceUnavailable from "../components/ServiceUnavailable";

export const MongoExpressPage = () => {
  const [isLoading, setLoading] = useState(true);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) {
      LoadConfig()
        .then((config) => {
          startMongoExpress(config)
            .then(() => {
              let retries = 30;
              let timer = setInterval(() => {
                if (retries === 0) {
                  clearInterval(timer);
                  throw new Error('Mongo Express failed to start after 30 seconds.');
                }
                checkMongoExpressStatus()
                  .then((status) => {
                    if (status === 'running') {
                      clearInterval(timer);
                      setReady(true);
                    }
                    retries--;
                  })
                  .catch((error) => {
                    console.log('Still connecting...', error);
                  });
              }, 1000);
            });
        })
        .catch((error) => {
          ddToast.error(error.toString());
          setReady(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  });

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {!isReady ? (
            <ServiceUnavailable />
          ) : (
            <Box display="flex" flex="1" width="100%" height="100%">
              <iframe src='http://localhost:8081/' width="100%" height="100%" />
            </Box>
          )}
        </>
      )}
    </>
  );
};
