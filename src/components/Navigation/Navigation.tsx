import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const Navigation: React.FC = () => {
  const { isAuthenticated, userRole, logout } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
          PMP Questions
        </Typography>
        
        {isAuthenticated ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Chip 
                label={userRole === 'admin' ? 'Admin' : 'Guest'} 
                color={userRole === 'admin' ? 'secondary' : 'default'}
                size="small"
                sx={{ mr: 2 }}
              />
              
              {/* Questions link only for admin users */}
              {userRole === 'admin' && (
                <Button color="inherit" component={Link} to="/questions">
                  Questions
                </Button>
              )}
              
              {/* Admin-only links */}
              {userRole === 'admin' && (
                <>
                  <Button color="inherit" component={Link} to="/admin/create">
                    Create
                  </Button>
                  <Button color="inherit" component={Link} to="/admin/manage">
                    Manage
                  </Button>
                </>
              )}
              
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </Box>
          </>
        ) : (
          <Button color="inherit" component={Link} to="/login">
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;