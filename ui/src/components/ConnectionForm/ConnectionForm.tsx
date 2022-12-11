import mongoExpressLogo from '../../assets/mongo-express-logo.png';
import { MongoDbConfig } from "../../types/MongoDbConfig";
import React, { Dispatch, SetStateAction } from "react";
import {
  Avatar,
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Link,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AUTH_BASIC } from "../../utils/constants";
import { ddClient, ddToast } from "../../api/utils";
import { ResetConfig } from '../../utils/config';

export const ConnectionForm = (
  extensionConfig: MongoDbConfig,
  setExtensionConfig: Dispatch<SetStateAction<MongoDbConfig>>,
  isButtonLoading?: boolean
) => {
  const handleResetCredentials = () => {
    ResetConfig()
      .then((config) => {
        setExtensionConfig(config);
        ddToast.success('Credentials reset.');
      })
      .catch((error) => {
        ddToast.error(error.toString());
      });
  };

  return (
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
        <Box>
          <Stack direction="row" alignItems="start" spacing={0}>
            <TextField
              disabled={isButtonLoading}
              margin="normal"
              fullWidth
              // id="hostname"
              label="Hostname"
              // name="hostname"
              // autoComplete="hostname"
              defaultValue={extensionConfig.hostname ?? 'localhost'}
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
              defaultValue={extensionConfig.port ?? 27017}
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
            defaultValue={extensionConfig.username ?? ''}
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
            defaultValue={extensionConfig.password ?? ''}
            onChange={(e: any) => setExtensionConfig({ ...extensionConfig, password: e.target.value })}
          />
        </Box>
      ) : (
        <>
          <TextField
            disabled={isButtonLoading}
            margin="normal"
            fullWidth
            key="connectionString"
            // id="connectionString"
            label="Connection String"
            // name="connectionString"
            // autoComplete="connectionString"
            defaultValue={extensionConfig.connectionString ?? "mongodb://localhost:27017"}
            // defaultValue={extensionConfig.connectionString ?? ''}
            onChange={(e: any) => setExtensionConfig({ ...extensionConfig, connectionString: e.target.value })}
          />
        </>
      )}
      <Grid container>
        <Grid item xs>
          <FormControlLabel
            disabled={isButtonLoading}
            label="Remember this connection"
            control={<Checkbox
              color="primary"
              checked={extensionConfig.rememberCredentials ?? false}
              onChange={(e: any) => setExtensionConfig({ ...extensionConfig, rememberCredentials: e.target.checked })}
            />}
          />
        </Grid>
        <Grid item>
          <Link
            href="#"
            onClick={handleResetCredentials}
            variant="body2"
          >
            {"Reset saved credentials"}
          </Link>
        </Grid>
      </Grid>
    </>
  );
};
