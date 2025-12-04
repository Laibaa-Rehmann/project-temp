import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Grid, Avatar, IconButton, Select,
  MenuItem, FormControl, InputLabel, Slider,
  Switch, FormControlLabel, Paper, Divider
} from '@mui/material';
import { PhotoCamera, Save, Cancel } from '@mui/icons-material';
import { freelancerApi } from '../../services/api';

const FreelancerProfile = () => {
  const [profile, setProfile] = useState({
    bio: '',
    hourly_rate: 25,
    availability: 'available',
    experience_years: 1,
    title: '',
    location: '',
    website: '',
    github: '',
    linkedin: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await freelancerApi.getProfile();
      setProfile(res.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await freelancerApi.updateProfile(profile);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field) => (event) => {
    setProfile({
      ...profile,
      [field]: event.target.value
    });
  };

  const handleRateChange = (event, newValue) => {
    setProfile({
      ...profile,
      hourly_rate: newValue
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left Column - Basic Info */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Professional Title"
                    value={profile.title}
                    onChange={handleChange('title')}
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={profile.location}
                    onChange={handleChange('location')}
                    placeholder="e.g., New York, USA"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Bio"
                    value={profile.bio}
                    onChange={handleChange('bio')}
                    placeholder="Tell clients about yourself, your experience, and skills..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Hourly Rate & Availability */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rate & Availability
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography gutterBottom>
                    Hourly Rate: ${profile.hourly_rate}/hr
                  </Typography>
                  <Slider
                    value={profile.hourly_rate}
                    onChange={handleRateChange}
                    min={10}
                    max={200}
                    step={5}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 10, label: '$10' },
                      { value: 50, label: '$50' },
                      { value: 100, label: '$100' },
                      { value: 200, label: '$200' }
                    ]}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Availability</InputLabel>
                    <Select
                      value={profile.availability}
                      label="Availability"
                      onChange={handleChange('availability')}
                    >
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="busy">Busy</MenuItem>
                      <MenuItem value="away">Away</MenuItem>
                      <MenuItem value="not_available">Not Available</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Years of Experience"
                    value={profile.experience_years}
                    onChange={handleChange('experience_years')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Social Links
              </Typography>
              
              <Grid container spacing={2}>
                {[
                  { field: 'website', label: 'Website', placeholder: 'https://yourportfolio.com' },
                  { field: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
                  { field: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' }
                ].map((social) => (
                  <Grid item xs={12} key={social.field}>
                    <TextField
                      fullWidth
                      label={social.label}
                      value={profile[social.field]}
                      onChange={handleChange(social.field)}
                      placeholder={social.placeholder}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Profile Photo & Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  sx={{ width: 150, height: 150, mb: 2 }}
                  src="/api/placeholder/150/150"
                />
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-photo-upload"
                  type="file"
                />
                <label htmlFor="profile-photo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                  >
                    Change Photo
                  </Button>
                </label>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  JPG, PNG up to 5MB
                </Typography>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Profile Visibility
                </Typography>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Public Profile"
                />
                <Typography variant="caption" color="textSecondary" display="block">
                  When enabled, your profile is visible to all clients
                </Typography>
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Job Notifications
                </Typography>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Email Alerts"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Push Notifications"
                />
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Cancel />}
                  sx={{ mt: 2 }}
                  onClick={() => fetchProfile()}
                >
                  Discard Changes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FreelancerProfile;