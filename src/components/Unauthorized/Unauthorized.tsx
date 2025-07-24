import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box } from '@mui/material';

const Unauthorized: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" paragraph>
          You don't have permission to access this page. This feature is only available to administrators.
        </Typography>
        <Button component={Link} to="/" variant="contained" color="primary">
          Return to Home
        </Button>
      </Box>
    </Container>
  );
};

export default Unauthorized;