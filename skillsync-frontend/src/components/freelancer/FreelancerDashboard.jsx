import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box,
  Button, Chip, LinearProgress, Avatar,
  Paper, IconButton, Stack
} from '@mui/material';
import {
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingIcon,
  Message as MessageIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { freelancerApi } from '../../services/api';

const FreelancerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    avgRating: 0,
    proposalSuccessRate: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile
      const profileRes = await freelancerApi.getProfile();
      setProfile(profileRes.data);
      
      // Fetch stats (you'll need to implement these endpoints)
      const projectsRes = await freelancerApi.getActiveProjects();
      const earningsRes = await freelancerApi.getEarnings();
      
      // Mock data for now - replace with actual API calls
      setStats({
        activeProjects: projectsRes.data?.length || 0,
        completedProjects: 5, // Replace with API
        totalEarnings: earningsRes.data?.total || 0,
        avgRating: 4.7,
        proposalSuccessRate: 65
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (!profile) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Welcome Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'white', color: 'primary.main' }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h4" gutterBottom>
                  Welcome back, {profile.full_name || profile.username}!
                </Typography>
                <Typography variant="body1">
                  {profile.bio || "Complete your profile to get more job opportunities"}
                </Typography>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                  startIcon={<EditIcon />}
                >
                  Edit Profile
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        {[
          {
            title: 'Active Projects',
            value: stats.activeProjects,
            icon: <WorkIcon fontSize="large" />,
            color: '#2196f3'
          },
          {
            title: 'Total Earnings',
            value: `$${stats.totalEarnings.toLocaleString()}`,
            icon: <MoneyIcon fontSize="large" />,
            color: '#4caf50'
          },
          {
            title: 'Avg. Rating',
            value: stats.avgRating,
            icon: <StarIcon fontSize="large" />,
            color: '#ff9800',
            suffix: '/5'
          },
          {
            title: 'Success Rate',
            value: `${stats.proposalSuccessRate}%`,
            icon: <TrendingIcon fontSize="large" />,
            color: '#9c27b0'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4">
                      {stat.value}{stat.suffix || ''}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {[
                  { label: 'Browse Jobs', icon: <WorkIcon />, color: 'primary' },
                  { label: 'Submit Proposal', icon: <AddIcon />, color: 'secondary' },
                  { label: 'Update Portfolio', icon: <EditIcon />, color: 'success' },
                  { label: 'View Messages', icon: <MessageIcon />, color: 'info' },
                  { label: 'Check Earnings', icon: <MoneyIcon />, color: 'warning' },
                  { label: 'Set Availability', icon: <ScheduleIcon />, color: 'error' }
                ].map((action, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={action.icon}
                      sx={{ color: `${action.color}.main`, borderColor: `${action.color}.main` }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Completion */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Completion
              </Typography>
              <Box sx={{ mt: 3, mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={75} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                75% complete
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {[
                  { label: 'Basic Info', completed: true },
                  { label: 'Skills', completed: true },
                  { label: 'Portfolio', completed: false },
                  { label: 'Hourly Rate', completed: true },
                  { label: 'Availability', completed: false }
                ].map((item, index) => (
                  <Box key={index} display="flex" alignItems="center">
                    {item.completed ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : (
                      <Box sx={{ width: 20, height: 20, border: '1px dashed grey', borderRadius: '50%', mr: 1 }} />
                    )}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {[
                { activity: 'Submitted proposal for "E-commerce Website"', time: '2 hours ago' },
                { activity: 'Client "TechCorp" viewed your profile', time: '1 day ago' },
                { activity: 'Received 5-star review for "Mobile App Project"', time: '2 days ago' },
                { activity: 'Withdrew $500 from earnings', time: '3 days ago' },
                { activity: 'Added 3 new portfolio items', time: '1 week ago' }
              ].map((item, index) => (
                <Box key={index} sx={{ py: 2, borderBottom: index < 4 ? '1px solid #eee' : 'none' }}>
                  <Typography variant="body1">{item.activity}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {item.time}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FreelancerDashboard;