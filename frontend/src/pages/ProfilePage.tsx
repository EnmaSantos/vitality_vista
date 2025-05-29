import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useAuth } from '../context/AuthContext';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { getUserProfile, updateUserProfile, UserProfileData } from '../services/profileApi';

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Lightly active (light exercise/sports 1-3 days/week)' },
  { value: 'moderate', label: 'Moderately active (moderate exercise/sports 3-5 days/week)' },
  { value: 'active', label: 'Very active (hard exercise/sports 6-7 days a week)' },
  { value: 'extra_active', label: 'Extra active (very hard exercise/physical job)' },
];

const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const ProfilePage: React.FC = () => {
  const { user, token } = useAuth();
  const { setCurrentThemeColor } = useThemeContext();

  const [profileData, setProfileData] = useState<UserProfileData>({
    date_of_birth: '',
    height_cm: null,
    weight_kg: null,
    gender: '',
    activity_level: '',
    fitness_goals: '',
    dietary_restrictions: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentThemeColor(themeColors.pakistanGreen);
  }, [setCurrentThemeColor]);

  const fetchProfile = useCallback(async () => {
    if (token) {
      setIsFetchingProfile(true);
      setError(null);
      try {
        const fetchedProfile = await getUserProfile(token);
        setProfileData({
          date_of_birth: fetchedProfile.date_of_birth || '',
          height_cm: fetchedProfile.height_cm === undefined ? null : fetchedProfile.height_cm,
          weight_kg: fetchedProfile.weight_kg === undefined ? null : fetchedProfile.weight_kg,
          gender: fetchedProfile.gender || '',
          activity_level: fetchedProfile.activity_level || '',
          fitness_goals: fetchedProfile.fitness_goals || '',
          dietary_restrictions: fetchedProfile.dietary_restrictions || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile data.');
        console.error("Error fetching profile:", err);
      } finally {
        setIsFetchingProfile(false);
      }
    } else {
        setIsFetchingProfile(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setProfileData(prev => ({
      ...prev,
      [name]: (name === 'height_cm' || name === 'weight_kg')
                ? (value === '' ? null : parseFloat(value))
                : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payloadToSubmit: UserProfileData = {
        date_of_birth: profileData.date_of_birth || null,
        height_cm: profileData.height_cm,
        weight_kg: profileData.weight_kg,
        gender: profileData.gender || null,
        activity_level: profileData.activity_level || null,
        fitness_goals: profileData.fitness_goals || null,
        dietary_restrictions: profileData.dietary_restrictions || null,
      };
      console.log('Submitting profile data:', payloadToSubmit);
      const updatedProfile = await updateUserProfile(payloadToSubmit, token);
      setProfileData({
          date_of_birth: updatedProfile.date_of_birth || '',
          height_cm: updatedProfile.height_cm === undefined ? null : updatedProfile.height_cm,
          weight_kg: updatedProfile.weight_kg === undefined ? null : updatedProfile.weight_kg,
          gender: updatedProfile.gender || '',
          activity_level: updatedProfile.activity_level || '',
          fitness_goals: updatedProfile.fitness_goals || '',
          dietary_restrictions: updatedProfile.dietary_restrictions || '',
      });
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
      console.error("Error updating profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (email: string): string => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    const charsToShow = 3;
    const maskedLocalPart = localPart.length > charsToShow
      ? localPart.substring(0, charsToShow) + '*'.repeat(Math.max(0, localPart.length - charsToShow))
      : localPart;
    return `${maskedLocalPart}@${domain}`;
  };

  if (isFetchingProfile) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading profile...</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 3, mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">Please log in to view your profile.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#283618ff', fontWeight: 'bold' }}>
          User Profile
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                value={user.firstName || ''}
                fullWidth
                InputProps={{ readOnly: true }}
                variant="filled"
                sx={{ bgcolor: 'grey.200' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                value={user.lastName || ''}
                fullWidth
                InputProps={{ readOnly: true }}
                variant="filled"
                sx={{ bgcolor: 'grey.200' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                value={maskEmail(user.email)}
                fullWidth
                InputProps={{ readOnly: true }}
                variant="filled"
                sx={{ bgcolor: 'grey.200' }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}><Typography variant="overline">Fitness Details</Typography></Divider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="date_of_birth"
                label="Date of Birth"
                type="date"
                variant="outlined"
                value={profileData.date_of_birth || ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" disabled={isLoading}>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  name="gender"
                  value={profileData.gender || ''}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {genderOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
               <FormControl fullWidth variant="outlined" disabled={isLoading}>
                <InputLabel id="activity-level-label">Activity Level</InputLabel>
                <Select
                  labelId="activity-level-label"
                  name="activity_level"
                  value={profileData.activity_level || ''}
                  onChange={handleChange}
                  label="Activity Level"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {activityLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
             <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="height_cm"
                label="Height (cm)"
                type="number"
                variant="outlined"
                value={profileData.height_cm ?? ''}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="weight_kg"
                label="Weight (kg)"
                type="number"
                variant="outlined"
                value={profileData.weight_kg ?? ''}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="fitness_goals"
                label="Fitness Goals"
                multiline
                rows={3}
                variant="outlined"
                value={profileData.fitness_goals || ''}
                onChange={handleChange}
                placeholder="e.g., lose 10kg, run a 5k, build muscle"
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="dietary_restrictions"
                label="Dietary Restrictions / Allergies"
                multiline
                rows={3}
                variant="outlined"
                value={profileData.dietary_restrictions || ''}
                onChange={handleChange}
                placeholder="e.g., vegetarian, gluten-free, peanut allergy"
                disabled={isLoading}
              />
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
              </Grid>
            )}
            {successMessage && (
              <Grid item xs={12}>
                <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
              </Grid>
            )}

            <Grid item xs={12} sx={{ textAlign: 'right' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || isFetchingProfile}
                sx={{ bgcolor: '#283618ff', '&:hover': { bgcolor: '#1e2a10ff' } }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage; 