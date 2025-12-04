import React from 'react';
import {
  AppBar, Toolbar, Typography, IconButton,
  Avatar, Box, Menu, MenuItem, Button
} from '@mui/material';
import { Menu as MenuIcon, Notifications, Mail } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          SkillSync
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit">
            <Mail />
          </IconButton>
          
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          
          <Button 
            color="inherit" 
            onClick={handleMenu}
            startIcon={<Avatar sx={{ width: 32, height: 32 }} />}
          >
            {user?.username}
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={() => { handleClose(); logout(); }}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;