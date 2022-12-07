import {Box, Container, Link, styled} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import React, { useEffect, useState } from "react";
import { ExtensionConfig } from "../types/ExtensionConfig";
import { AUTH_BASIC } from "../utils/constants";
import { isConfigured, SaveConfig } from "../utils/config";
import { dockerDesktopClient, dockerDesktopToast } from "../api/utils";
import { ConnectionForm } from "../components/ConnectionForm/ConnectionForm";
import {ExtensionHeader} from "../components/ExtensionHeader/ExtensionHeader";
import Loader from "../components/Loader";

export const LoginPage = () => {
  const [extensionConfig, setExtensionConfig] = useState<ExtensionConfig>({ authMethod: AUTH_BASIC });
  const [isButtonLoading, setButtonLoading] = useState(false);
  const [isLoading, setLoading] = useState(true);

  const credentialsNotEmpty =
    (extensionConfig.hostname && extensionConfig.port) ||
    extensionConfig.connectionString;

  const HandleConnect = async () => {
    setButtonLoading(true);
    if (extensionConfig.authMethod === AUTH_BASIC) {
      extensionConfig.connectionString = undefined;
    } else {
      extensionConfig.hostname = undefined;
      extensionConfig.port = undefined;
      extensionConfig.username = undefined;
      extensionConfig.password = undefined;
    }
    if (extensionConfig.rememberCredentials) {
      await SaveConfig(extensionConfig);
    }
    // TODO: start mongo-express with the provided configuration and navigate to mongo-express local address
    dockerDesktopToast.success(
      'hostname: ' + extensionConfig.hostname + '\n' +
      'port: ' + extensionConfig.port + '\n' +
      'username: ' + extensionConfig.username + '\n' +
      'password: ' + extensionConfig.password + '\n' +
      'connectionString: ' + extensionConfig.connectionString + '\n' +
      'rememberCredentials: ' + extensionConfig.rememberCredentials + '\n' +
      'authMethod: ' + extensionConfig.authMethod
    );
    setButtonLoading(false);
  };

  useEffect(() => {
    if (isLoading) {
      isConfigured()
        .then((configured) => {
          if (configured) {
            // TODO: set initial state from config
            dockerDesktopToast.success('Credentials not empty: ' + credentialsNotEmpty + '.');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  });

  return (
    <>
      <ExtensionHeader />
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 4,
          }}
        >
          {isLoading ? (
            <Loader />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onKeyDown={(event) => {
                if (credentialsNotEmpty && event.key === 'Enter') {
                  HandleConnect().then(r => r);
                }
              }}
            >
              {ConnectionForm(extensionConfig, setExtensionConfig, isButtonLoading)}
              <LoadingButton
                sx={{ width: '100%' }}
                disabled={!credentialsNotEmpty}
                loading={isButtonLoading}
                type="submit"
                variant="contained"
                onClick={HandleConnect}
              >
                Connect
              </LoadingButton>
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
};
