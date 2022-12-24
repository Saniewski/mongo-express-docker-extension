import { Box, Container } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExtensionConfig } from "../types/ExtensionConfig";
import { AUTH_BASIC } from "../utils/constants";
import { LoadConfig, SaveConfig } from "../utils/config";
import { ddToast } from "../api/utils";
import { ConnectionForm } from "../components/ConnectionForm/ConnectionForm";
import { ExtensionHeader } from "../components/ExtensionHeader/ExtensionHeader";
import { Loader } from "../components/Loader/Loader";

export const LoginPage = () => {
  const [extensionConfig, setExtensionConfig] = useState<ExtensionConfig>({ authMethod: AUTH_BASIC });
  const [isButtonLoading, setButtonLoading] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      const savingResult = await SaveConfig(extensionConfig);
      if (!savingResult) {
        setButtonLoading(false);
        ddToast.error("Failed to save credentials");
      }
    }
    navigate('/mongo-express', {
      state: {
        extensionConfig: extensionConfig,
      }
    });
    setButtonLoading(false);
  };

  useEffect(() => {
    // if (isLoading) {
    LoadConfig()
      .then((config) => {
        if (config) {
          setExtensionConfig(config);
        }
      })
      .catch((error) => {
        console.error(error.toString());
        ddToast.error(error.toString());
      })
      .finally(() => {
        setLoading(false);
      });
    // }
  }, [isLoading]);

  return (
    <>
      <ExtensionHeader />
      {/*<Typography>credentialsNotEmpty: "{credentialsNotEmpty}"</Typography>*/}
      {/*<Typography>{JSON.stringify(extensionConfig).split(',').join(', ')}</Typography>*/}
      <Container component="main" maxWidth="xs">
        <Box mt={4} >
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
