import mongoExpressLogo from '../../assets/mongo-express-logo.png';
import { ExtensionConfig } from "../../types/ExtensionConfig";
import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Link,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AUTH_BASIC, AUTH_CONNECTION_STRING } from "../../utils/constants";
import { ddClient, ddToast } from "../../api/utils";
import { LoadConfig, ResetConfig, SaveConfig } from '../../utils/config';
import { LoadingButton } from "@mui/lab";
import { useNavigate } from "react-router-dom";

export const ConnectionForm = () => {
  const [extensionConfig, setExtensionConfig] = useState<ExtensionConfig>({ authMethod: AUTH_BASIC });
  const [isButtonLoading, setButtonLoading] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const navigate = useNavigate();

  const credentialsNotEmpty = !!(
    (extensionConfig.authMethod === AUTH_BASIC && extensionConfig.hostname && extensionConfig.port) ||
    (extensionConfig.authMethod === AUTH_CONNECTION_STRING && extensionConfig.connectionString));

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

  const HandleResetCredentials = () => {
    ResetConfig()
      .then((config) => {
        setExtensionConfig(config);
        ddToast.success('Credentials reset.');
      })
      .catch((error) => {
        ddToast.error(error.toString());
      });
  };

  useEffect(() => {
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
  }, [isLoading]);

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && credentialsNotEmpty) {
            HandleConnect().then(r => r);
          }
        }}
      >
        {isLoading ? (
          <CircularProgress />
        ) : (
          <>
            <Avatar sx={{ m: 1, width: 60, height: 60 }} alt="Mongo Express Logo" src={mongoExpressLogo} />
            <Typography variant="h5">Connect to MongoDB</Typography>
            <Link
              href="#"
              onClick={() => ddClient?.host?.openExternal('https://www.mongodb.com/docs/manual/reference/connection-string/')}
              variant="body2"
            >
              {"Get help connecting to MongoDB "}
              <OpenInNewIcon fontSize="inherit" />
            </Link>
            <RadioGroup
              sx={{ mt: 2 }}
              aria-disabled
              row
              value={extensionConfig.authMethod ?? 'basic'}
              defaultValue={extensionConfig.authMethod}
              name="radio-buttons-group"
            >
              <FormControlLabel
                disabled={isButtonLoading}
                onClick={
                  isButtonLoading
                    ? undefined
                    : (e: any) => setExtensionConfig({ ...extensionConfig, authMethod: e.target.value })
                }
                value="basic"
                control={<Radio />}
                label="Basic"
              />
              <FormControlLabel
                disabled={isButtonLoading}
                onClick={
                  isButtonLoading
                    ? undefined
                    : (e: any) =>
                      setExtensionConfig({
                        ...extensionConfig,
                        authMethod: e.target.value,
                      })
                }
                value="connectionString"
                control={<Radio />}
                label="Connection String"
              />
            </RadioGroup>
            {extensionConfig.authMethod === AUTH_BASIC ? (
              <>
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={0}>
                  <TextField
                    disabled={isButtonLoading}
                    margin="normal"
                    fullWidth
                    // id="hostname"
                    label="Hostname"
                    // name="hostname"
                    // autoComplete="hostname"
                    // defaultValue={extensionConfig.hostname ?? 'localhost'}
                    value={extensionConfig.hostname}
                    required
                    autoFocus
                    onChange={(e: any) => setExtensionConfig({ ...extensionConfig, hostname: e.target.value })}
                  />
                  <TextField
                    disabled={isButtonLoading}
                    margin="normal"
                    // id="port"
                    label="Port"
                    // name="port"
                    type="number"
                    // autoComplete="port"
                    // defaultValue={extensionConfig.port ?? 27017}
                    value={extensionConfig.port}
                    required
                    onChange={(e: any) => setExtensionConfig({ ...extensionConfig, port: e.target.value })}
                  />
                </Stack>
                <TextField
                  disabled={isButtonLoading}
                  margin="normal"
                  fullWidth
                  key="username"
                  // id="username"
                  label="Username"
                  // name="username"
                  // autoComplete="username"
                  // defaultValue={extensionConfig.username ?? ''}
                  value={extensionConfig.username}
                  onChange={(e: any) => setExtensionConfig({ ...extensionConfig, username: e.target.value })}
                />
                <TextField
                  disabled={isButtonLoading}
                  margin="normal"
                  fullWidth
                  key="password"
                  // id="password"
                  label="Password"
                  // name="password"
                  type="password"
                  autoComplete="password"
                  // defaultValue={extensionConfig.password ?? ''}
                  value={extensionConfig.password}
                  onChange={(e: any) => setExtensionConfig({ ...extensionConfig, password: e.target.value })}
                />
              </>
            ) : (
              <TextField
                disabled={isButtonLoading}
                margin="normal"
                fullWidth
                key="connectionString"
                // id="connectionString"
                label="Connection String"
                // name="connectionString"
                // autoComplete="connectionString"
                // defaultValue={extensionConfig.connectionString ?? "mongodb://localhost:27017"}
                // defaultValue={extensionConfig.connectionString ?? ''}
                value={extensionConfig.connectionString}
                onChange={(e: any) => setExtensionConfig({ ...extensionConfig, connectionString: e.target.value })}
              />
            )}
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={0}>
              <FormControlLabel
                disabled={isButtonLoading}
                label="Remember this connection"
                // value={extensionConfig.rememberCredentials}
                control={<Checkbox
                  color="primary"
                  checked={extensionConfig.rememberCredentials ?? false}
                  onChange={(e: any) => setExtensionConfig({ ...extensionConfig, rememberCredentials: e.target.checked })}
                />}
              />
              <Link
                href="#"
                onClick={HandleResetCredentials}
                variant="body2"
              >
                {"Reset saved credentials"}
              </Link>
            </Stack>
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
          </>
        )}
      </Box>
    </Container>
  );
};
