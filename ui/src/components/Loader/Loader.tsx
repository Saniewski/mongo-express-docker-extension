import mongoExpressLogo from '../../assets/mongo-express-logo.png';
import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import { Box, Container } from '@mui/material';

export const Loader = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <BouncingLogo src={mongoExpressLogo} alt="" />
      </Box>
    </Container>
  );
};

const heartbeat = keyframes`
from {
  transform: scale3d(1, 1, 1);
}

50% {
  transform: scale3d(1.25, 1.25, 1.25);
}

to {
  transform: scale3d(1, 1, 1);
}
`;

const BouncingLogo = styled('img')`
  width: 60px;
  animation: ${heartbeat} 2s infinite;
`;
