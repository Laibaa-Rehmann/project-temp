import React from 'react';
import {
  Drawer, List, ListItem, ListItemIcon,
  ListItemText, Box, Divider
} from '@mui/material';
import {
  Dashboard, Person, Build, PhotoLibrary,
  Description, Work, AttachMoney, RateReview
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/freelancer/dashboard' },
  { text: 'Profile', icon: <Person />, path: '/freelancer/profile' },
  { text: 'Skills', icon: <Build />, path: '/freelancer/skills' },
  { text: 'Portfolio', icon: <PhotoLibrary />, path: '/freelancer/portfolio' },
  { text: 'Proposals', icon: <Description />, path: '/freelancer/proposals' },
  { text: 'Find Work', icon: <Work />, path: '/find-work' },
  { text: 'Earnings', icon: <AttachMoney />, path: '/freelancer/earnings' },
  { text: 'Reviews', icon: <RateReview />, path: '/freelancer/reviews' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Freelancer Panel
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;