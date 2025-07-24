import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, TextField, Box, Typography, Container, Paper } from '@mui/material';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle login with username and password
  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    // Don't allow empty username or password
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    
    // Simple password check - in a real app, use proper authentication
    if (username === 'admin' && password === process.env.REACT_APP_ADMIN_PASSWORD) {
      login('admin');
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  // Handle guest access
  const handleGuestAccess = () => {
    login('guest');
    navigate('/');
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
          PMP Questions App
        </Typography>
        
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <TextField
            margin="normal"
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" align="center" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
          >
            Sign In
          </Button>
          
          <Typography align="center" sx={{ mt: 2, mb: 1 }}>
            - OR -
          </Typography>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGuestAccess}
            sx={{ mt: 1 }}
          >
            Continue as Guest
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;