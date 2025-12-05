// ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Button,
  TextField,
  Avatar,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Rating,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  CheckCircle,
  Email,
  Phone,
  LocationOn,
  Work,
  AttachMoney,
  Business,
  CalendarToday,
  Star,
  StarBorder,
  Upload,
  Link as LinkIcon,
  Language,
  GitHub,
  LinkedIn,
  Twitter,
  Instagram,
  Add,
  Delete
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    profile_completion: 0,
    response_rate: 0,
    job_success_score: 0,
    avg_response_time_hours: 0,
    pending_earnings: 0
  });
  const [formData, setFormData] = useState({
    full_name: '',
    profile_title: '',
    description: '',
    skills: '',
    hourly_rate: '',
    country: '',
    company_name: '',
    profile_picture: ''
  });

  useEffect(() => {
    fetchUserProfile();
    fetchDashboardStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setFormData({
        full_name: response.data.full_name || '',
        profile_title: response.data.profile_title || '',
        description: response.data.description || '',
        skills: response.data.skills || '',
        hourly_rate: response.data.hourly_rate || '',
        country: response.data.country || '',
        company_name: response.data.company_name || '',
        profile_picture: response.data.profile_picture || ''
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      full_name: user.full_name || '',
      profile_title: user.profile_title || '',
      description: user.description || '',
      skills: user.skills || '',
      hourly_rate: user.hourly_rate || '',
      country: user.country || '',
      company_name: user.company_name || '',
      profile_picture: user.profile_picture || ''
    });
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      // First update user profile
      const response = await axios.put(
        `${API_BASE_URL}/users/me`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUser(response.data);
      setEditing(false);
      fetchDashboardStats(); // Refresh stats
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillAdd = (skill) => {
    const currentSkills = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [];
    if (skill && !currentSkills.includes(skill)) {
      const newSkills = [...currentSkills, skill].join(', ');
      setFormData(prev => ({ ...prev, skills: newSkills }));
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    const currentSkills = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [];
    const newSkills = currentSkills.filter(skill => skill !== skillToRemove).join(', ');
    setFormData(prev => ({ ...prev, skills: newSkills }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const calculateProfileCompletion = () => {
    if (!user) return 0;
    
    const fields = [
      user.full_name,
      user.profile_title,
      user.description,
      user.skills,
      user.hourly_rate,
      user.country,
    ];
    
    const filledFields = fields.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const profileCompletion = calculateProfileCompletion();
  const skillsList = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Profile Info */}
        <Grid item xs={12} md={8}>
          {/* Profile Header Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      border: '3px solid',
                      borderColor: 'primary.main'
                    }}
                    src={formData.profile_picture}
                  >
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <div>
                      {editing ? (
                        <TextField
                          fullWidth
                          label="Full Name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          sx={{ mb: 1 }}
                        />
                      ) : (
                        <Typography variant="h5" fontWeight="bold">
                          {user?.full_name || user?.username}
                        </Typography>
                      )}
                      
                      {editing ? (
                        <TextField
                          fullWidth
                          label="Profile Title"
                          name="profile_title"
                          value={formData.profile_title}
                          onChange={handleInputChange}
                          sx={{ mb: 1 }}
                        />
                      ) : (
                        <Typography variant="h6" color="text.secondary">
                          {user?.profile_title || 'Add a profile title'}
                        </Typography>
                      )}
                      
                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <LocationOn fontSize="small" color="action" />
                        {editing ? (
                          <TextField
                            size="small"
                            label="Country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <Typography variant="body2">
                            {user?.country || 'Add your location'}
                          </Typography>
                        )}
                        <Star fontSize="small" color="warning" sx={{ ml: 2 }} />
                        <Typography variant="body2">
                          {user?.verified ? 'Verified' : 'Not Verified'}
                        </Typography>
                      </Box>
                    </div>
                    
                    <div>
                      {editing ? (
                        <Box display="flex" gap={1}>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Save />}
                            onClick={handleSave}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<Cancel />}
                            onClick={handleCancel}
                          >
                            Cancel
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={handleEdit}
                        >
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Profile Details Tabs */}
          <Card>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="About" />
              <Tab label="Skills" />
              <Tab label="Portfolio" />
              <Tab label="Reviews" />
            </Tabs>
            
            <CardContent>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    About Me
                  </Typography>
                  {editing ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell clients about yourself, your experience, and what you can offer..."
                    />
                  ) : (
                    <Typography variant="body1" paragraph>
                      {user?.description || 'Add a description about yourself and your experience.'}
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AttachMoney color="action" />
                        <Typography variant="body2">Hourly Rate:</Typography>
                        {editing ? (
                          <TextField
                            size="small"
                            type="number"
                            label="Hourly Rate ($)"
                            name="hourly_rate"
                            value={formData.hourly_rate}
                            onChange={handleInputChange}
                            sx={{ ml: 1 }}
                          />
                        ) : (
                          <Typography variant="body1" fontWeight="medium">
                            ${user?.hourly_rate || '0'}/hr
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Work color="action" />
                        <Typography variant="body2">Member Since:</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {user?.created_at ? new Date(user.created_at).getFullYear() : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {user?.company_name && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Business color="action" />
                          <Typography variant="body2">Company:</Typography>
                          {editing ? (
                            <TextField
                              size="small"
                              label="Company Name"
                              name="company_name"
                              value={formData.company_name}
                              onChange={handleInputChange}
                              sx={{ ml: 1 }}
                            />
                          ) : (
                            <Typography variant="body1" fontWeight="medium">
                              {user.company_name}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
              
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Skills & Expertise
                  </Typography>
                  
                  {editing ? (
                    <Box>
                      <Box display="flex" gap={1} mb={2}>
                        <TextField
                          size="small"
                          placeholder="Add a skill (e.g., React, Python, UI/UX)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              handleSkillAdd(e.target.value.trim());
                              e.target.value = '';
                            }
                          }}
                          sx={{ flexGrow: 1 }}
                        />
                        <Button
                          variant="contained"
                          onClick={() => {
                            const input = document.querySelector('input[placeholder*="Add a skill"]');
                            if (input && input.value.trim()) {
                              handleSkillAdd(input.value.trim());
                              input.value = '';
                            }
                          }}
                        >
                          <Add />
                        </Button>
                      </Box>
                      
                      <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                        {skillsList.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            onDelete={() => handleSkillRemove(skill)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                        {skillsList.length === 0 && (
                          <Typography color="text.secondary">
                            No skills added yet. Add your skills above.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {skillsList.map((skill, index) => (
                        <Chip key={index} label={skill} color="primary" variant="outlined" />
                      ))}
                      {skillsList.length === 0 && (
                        <Typography color="text.secondary">
                          No skills added yet. Edit your profile to add skills.
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
              
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Portfolio
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    Showcase your best work to attract clients.
                  </Typography>
                  <Button variant="outlined" startIcon={<Add />}>
                    Add Portfolio Item
                  </Button>
                </Box>
              )}
              
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Reviews & Ratings
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h2" fontWeight="bold">
                        4.8
                      </Typography>
                      <Box>
                        <Rating value={4.8} readOnly precision={0.1} />
                        <Typography variant="body2" color="text.secondary">
                          Based on 24 reviews
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Stats & Progress */}
        <Grid item xs={12} md={4}>
          {/* Profile Completion Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Profile Completion
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <CircularProgress
                  variant="determinate"
                  value={profileCompletion}
                  size={80}
                  thickness={5}
                />
                <Box ml={2}>
                  <Typography variant="h4">{profileCompletion}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Complete these sections to improve your profile:
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color={user?.full_name ? "success" : "disabled"} />
                  </ListItemIcon>
                  <ListItemText primary="Basic Info" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color={user?.profile_title ? "success" : "disabled"} />
                  </ListItemIcon>
                  <ListItemText primary="Profile Title" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color={user?.skills ? "success" : "disabled"} />
                  </ListItemIcon>
                  <ListItemText primary="Skills & Expertise" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color={user?.hourly_rate ? "success" : "disabled"} />
                  </ListItemIcon>
                  <ListItemText primary="Hourly Rate" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color={user?.description ? "success" : "disabled"} />
                  </ListItemIcon>
                  <ListItemText primary="Portfolio & Description" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color={user?.verified ? "success" : "disabled"} />
                  </ListItemIcon>
                  <ListItemText primary="Verification" />
                </ListItem>
              </List>
              
              {profileCompletion < 100 && (
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleEdit}
                >
                  Complete Profile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Performance Metrics
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Response Rate"
                    secondary={`${stats.response_rate}%`}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={stats.response_rate}
                    sx={{ width: 100, height: 8, borderRadius: 4 }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Job Success Score"
                    secondary={`${stats.job_success_score}%`}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={stats.job_success_score}
                    sx={{ width: 100, height: 8, borderRadius: 4 }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Avg Response Time"
                    secondary={`${stats.avg_response_time_hours} hours`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Pending Earnings"
                    secondary={`$${stats.pending_earnings.toFixed(2)}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Stats
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="h5">12</Typography>
                    <Typography variant="caption">Jobs Completed</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                    <Typography variant="h5">24</Typography>
                    <Typography variant="caption">Total Proposals</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                    <Typography variant="h5">98%</Typography>
                    <Typography variant="caption">On Time</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                    <Typography variant="h5">4.8</Typography>
                    <Typography variant="caption">Rating</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;