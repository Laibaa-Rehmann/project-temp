import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Grid, Chip, IconButton, Autocomplete,
  Select, MenuItem, FormControl, InputLabel, Paper
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { freelancerApi } from '../../services/api';

const FreelancerSkills = () => {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [proficiency, setProficiency] = useState('intermediate');
  const [availableSkills, setAvailableSkills] = useState([
    'React', 'JavaScript', 'Python', 'Node.js', 'TypeScript',
    'UI/UX Design', 'Graphic Design', 'Content Writing', 'SEO',
    'Data Analysis', 'Machine Learning', 'Flutter', 'React Native'
  ]);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await freelancerApi.getSkills();
      setSkills(res.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    
    try {
      await freelancerApi.addSkill({
        name: newSkill,
        proficiency_level: proficiency
      });
      setNewSkill('');
      fetchSkills();
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await freelancerApi.removeSkill(skillId);
      fetchSkills();
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Skills
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add New Skill
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    freeSolo
                    options={availableSkills}
                    value={newSkill}
                    onChange={(event, newValue) => setNewSkill(newValue || '')}
                    inputValue={newSkill}
                    onInputChange={(event, newInputValue) => setNewSkill(newInputValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Skill Name"
                        placeholder="Type or select a skill"
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Proficiency Level</InputLabel>
                    <Select
                      value={proficiency}
                      label="Proficiency Level"
                      onChange={(e) => setProficiency(e.target.value)}
                    >
                      <MenuItem value="beginner">Beginner</MenuItem>
                      <MenuItem value="intermediate">Intermediate</MenuItem>
                      <MenuItem value="expert">Expert</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim()}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                My Skills ({skills.length})
              </Typography>
              
              <Grid container spacing={1}>
                {skills.length === 0 ? (
                  <Typography color="textSecondary">
                    No skills added yet. Add your first skill above!
                  </Typography>
                ) : (
                  skills.map((skill) => (
                    <Grid item key={skill.id}>
                      <Chip
                        label={`${skill.name} (${skill.proficiency_level})`}
                        onDelete={() => handleRemoveSkill(skill.id)}
                        deleteIcon={<Delete />}
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skill Insights
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Skills help you:
                </Typography>
                <ul>
                  <li>Get matched with relevant projects</li>
                  <li>Increase your visibility to clients</li>
                  <li>Justify your hourly rate</li>
                  <li>Build credibility</li>
                </ul>
                
                <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
                  Tips:
                </Typography>
                <ul>
                  <li>Add 5-10 key skills</li>
                  <li>Be honest about proficiency</li>
                  <li>Update skills regularly</li>
                </ul>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FreelancerSkills;