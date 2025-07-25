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

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    // Check if admin with password
    if (username === 'admin') {
      if (!password.trim()) {
        setError('Please enter a password for admin');
        return;
      }
      if (password !== process.env.REACT_APP_ADMIN_PASSWORD) {
        setError('Invalid admin password');
        return;
      }
    }
    
    // Generate Base64 token
    const tokenData = {
      username: username.trim(),
      role: username === 'admin' ? 'admin' : 'user',
      timestamp: Date.now()
    };
    const token = btoa(JSON.stringify(tokenData));
    
    localStorage.setItem('authToken', token);
    login(username === 'admin' ? 'admin' : 'guest');
    navigate('/');
  };

  // Handle guest access
  const handleGuestAccess = () => {
    const tokenData = {
      username: 'guest',
      role: 'guest',
      timestamp: Date.now()
    };
    const token = btoa(JSON.stringify(tokenData));
    
    localStorage.setItem('authToken', token);
    login('guest');
    navigate('/');
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography component="h1" variant="h5" align="center" sx={{ mb: 3, fontWeight: 'bold' }}>
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
            helperText={username === 'admin' ? 'Password required for admin' : 'Password optional for other users'}
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