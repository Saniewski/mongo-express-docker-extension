import mongoExpressLogo from '../../assets/mongo-express-logo.png';
import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import { Box } from '@mui/material';

const Loader = () => {
  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      <BouncingLogo src={mongoExpressLogo} alt="" />
    </Box>
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

export default Loader;
