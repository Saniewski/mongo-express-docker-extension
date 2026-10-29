import { Box, Link, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { ddClient } from "../../api/utils";

export const ExtensionFooter = () => (
  <Box component="footer" sx={{ mt: "auto", pt: 2 }}>
    <Typography variant="caption" color="textSecondary">
      A Mongo Express container starts when you open a connection and is removed when you return
      here. Your saved credentials remain in this Docker Desktop extension&apos;s browser storage.{" "}
      <Link
        component="button"
        variant="inherit"
        underline="hover"
        onClick={() =>
          ddClient.host.openExternal(
            "https://github.com/Saniewski/mongo-express-docker-extension/issues/new",
          )
        }
      >
        Give feedback <OpenInNewIcon sx={{ fontSize: "1em", verticalAlign: "text-bottom" }} />
      </Link>
    </Typography>
  </Box>
);
