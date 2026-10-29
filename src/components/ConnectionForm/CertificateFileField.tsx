import { Button, Stack, TextField } from "@mui/material";
import { ddClient, ddToast } from "../../api/utils";
import { getErrorMessage } from "../../api/errors";

type CertificateFileFieldProps = {
  label: string;
  value: string;
  helperText: string;
  onChange: (value: string) => void;
};

export const CertificateFileField = ({
  label,
  value,
  helperText,
  onChange,
}: CertificateFileFieldProps) => {
  const browse = async () => {
    try {
      const result = await ddClient.desktopUI.dialog.showOpenDialog({
        title: `Select ${label.toLowerCase()}`,
        properties: ["openFile", "showHiddenFiles"],
        filters: [
          { name: "PEM certificates", extensions: ["pem", "crt", "cer", "key"] },
          { name: "All files", extensions: ["*"] },
        ],
      });
      if (!result.canceled && result.filePaths[0]) onChange(result.filePaths[0]);
    } catch (error) {
      ddToast.error(
        getErrorMessage(error, "Could not open the file picker. Enter the full path instead."),
      );
    }
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        helperText={helperText}
        placeholder="/absolute/path/to/certificate.pem"
      />
      <Button onClick={browse} aria-label={`Browse for ${label.toLowerCase()}`} sx={{ mt: 1 }}>
        Browse
      </Button>
    </Stack>
  );
};
