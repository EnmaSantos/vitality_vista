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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useAuth } from '../context/AuthContext';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { getUserProfile, updateUserProfile, UserProfileData } from '../services/profileApi';

interface ProfileFormState {
  date_of_birth: string;
  height_cm: string;
  weight_kg: string;
  gender: string;
  activity_level: string;
  fitness_goals: string;
  dietary_restrictions: string;
}

// Separate state for calculated metabolic data
interface MetabolicDataState {
  age: number | null;
  bmr: number | null;
  tdee: number | null;
}

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


const cmToFtIn = (cm: number) => {
  const realFeet = (cm * 0.393700787) / 12;
  const feet = Math.floor(realFeet);
  const inches = Math.round((realFeet - feet) * 12);
  return { feet, inches: inches === 12 ? 0 : inches }; // Handle 12 inches case
};

const ftInToCm = (feet: number, inches: number) => {
  return Math.round((feet * 30.48) + (inches * 2.54));
};

const kgToLbs = (kg: number) => {
  return parseFloat((kg * 2.20462).toFixed(1));
};

const lbsToKg = (lbs: number) => {
  return parseFloat((lbs / 2.20462).toFixed(1));
};

const ProfilePage: React.FC = () => {
  const { user, token } = useAuth();
  const { setCurrentThemeColor } = useThemeContext();

  const [profileData, setProfileData] = useState<ProfileFormState>({
    date_of_birth: '',
    height_cm: '',
    weight_kg: '',
    gender: '',
    activity_level: '',
    fitness_goals: '',
    dietary_restrictions: '',
  });

  // Unit States
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  // Display States (what user sees in inputs)
  const [heightDisplay, setHeightDisplay] = useState<{ ft: string, in: string, cm: string }>({ ft: '', in: '', cm: '' });
  const [weightDisplay, setWeightDisplay] = useState<{ kg: string, lbs: string }>({ kg: '', lbs: '' });


  // State for metabolic data
  const [metabolicData, setMetabolicData] = useState<MetabolicDataState>({
    age: null,
    bmr: null,
    tdee: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [originalProfileData, setOriginalProfileData] = useState<ProfileFormState | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<string[]>([]);

  useEffect(() => {
    setCurrentThemeColor(themeColors.pakistanGreen);
  }, [setCurrentThemeColor]);

  const processFetchedProfile = (fetchedProfile: UserProfileData) => {
    const formattedData = {
      date_of_birth: fetchedProfile.date_of_birth ? fetchedProfile.date_of_birth.split('T')[0] : '',
      height_cm: fetchedProfile.height_cm?.toString() || '',
      weight_kg: fetchedProfile.weight_kg?.toString() || '',
      gender: fetchedProfile.gender || '',
      activity_level: fetchedProfile.activity_level || '',
      fitness_goals: fetchedProfile.fitness_goals || '',
      dietary_restrictions: fetchedProfile.dietary_restrictions || '',
    };
    setProfileData(formattedData);
    setOriginalProfileData(formattedData);

    // Initialize Display Values
    if (fetchedProfile.height_cm) {
      const { feet, inches } = cmToFtIn(fetchedProfile.height_cm);
      setHeightDisplay({
        cm: fetchedProfile.height_cm.toString(),
        ft: feet.toString(),
        in: inches.toString()
      });
    }
    if (fetchedProfile.weight_kg) {
      const lbs = kgToLbs(fetchedProfile.weight_kg);
      setWeightDisplay({
        kg: fetchedProfile.weight_kg.toString(),
        lbs: lbs.toString()
      });
    }

    setMetabolicData({
      age: fetchedProfile.age === undefined ? null : fetchedProfile.age,
      bmr: fetchedProfile.bmr === undefined ? null : fetchedProfile.bmr,
      tdee: fetchedProfile.tdee === undefined ? null : fetchedProfile.tdee,
    });
  };

  const fetchProfile = useCallback(async () => {
    if (token) {
      setIsFetchingProfile(true);
      setError(null);
      try {
        const fetchedProfile = await getUserProfile(token);
        processFetchedProfile(fetchedProfile);
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

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDisplay = { ...heightDisplay, [e.target.name]: e.target.value };
    setHeightDisplay(newDisplay);

    let newCm = '';
    if (heightUnit === 'cm') {
      newCm = e.target.value;
      // Sync ft/in display for when user swaps toggle
      if (newCm) {
        const { feet, inches } = cmToFtIn(parseFloat(newCm));
        newDisplay.ft = feet.toString();
        newDisplay.in = inches.toString();
      } else {
        newDisplay.ft = '';
        newDisplay.in = '';
      }
    } else {
      const ft = parseFloat(newDisplay.ft) || 0;
      const inch = parseFloat(newDisplay.in) || 0;
      if (newDisplay.ft || newDisplay.in) {
        newCm = ftInToCm(ft, inch).toString();
      }
      newDisplay.cm = newCm;
    }

    setProfileData(prev => ({ ...prev, height_cm: newCm }));
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const newDisplay = { ...weightDisplay, [weightUnit]: newVal };
    setWeightDisplay(newDisplay);

    let newKg = '';
    if (weightUnit === 'kg') {
      newKg = newVal;
      // Sync lbs
      if (newKg) {
        newDisplay.lbs = kgToLbs(parseFloat(newKg)).toString();
      } else {
        newDisplay.lbs = '';
      }
    } else {
      // Unit is lbs
      if (newVal) {
        newKg = lbsToKg(parseFloat(newVal)).toString();
        newDisplay.kg = newKg;
      } else {
        newKg = '';
        newDisplay.kg = '';
      }
    }
    setProfileData(prev => ({ ...prev, weight_kg: newKg }));
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = event.target;
    if (name === 'height_cm' || name === 'weight_kg') return; // Handled separately
    setProfileData(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const getReadableLabel = (key: string) => {
    const labels: Record<string, string> = {
      date_of_birth: "Date of Birth",
      height_cm: "Height",
      weight_kg: "Weight",
      gender: "Gender",
      activity_level: "Activity Level",
      fitness_goals: "Fitness Goals",
      dietary_restrictions: "Dietary Restrictions"
    };
    return labels[key] || key;
  };

  const handleSaveClick = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    // Check modification
    const isModified = pendingChanges.length > 0 || (originalProfileData && JSON.stringify(profileData) !== JSON.stringify(originalProfileData));
    if (!isModified) return;

    if (profileData.date_of_birth) {
      const today = new Date();
      const dob = new Date(profileData.date_of_birth);
      if (dob > today) {
        setError("Date of birth cannot be in the future.");
        return;
      }
    }

    const changes: string[] = [];
    if (originalProfileData) {
      (Object.keys(profileData) as Array<keyof ProfileFormState>).forEach((key) => {
        if (profileData[key] !== originalProfileData[key]) {
          const label = getReadableLabel(key);
          changes.push(label);
        }
      });
    }

    if (changes.length === 0) {
      setSuccessMessage("No changes detected.");
      return;
    }

    setPendingChanges(changes);
    setOpenConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setOpenConfirmDialog(false);
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payloadToSubmit: UserProfileData = {
        date_of_birth: profileData.date_of_birth || null,
        height_cm: profileData.height_cm ? parseFloat(profileData.height_cm) : null,
        weight_kg: profileData.weight_kg ? parseFloat(profileData.weight_kg) : null,
        gender: profileData.gender || null,
        activity_level: profileData.activity_level || null,
        fitness_goals: profileData.fitness_goals || null,
        dietary_restrictions: profileData.dietary_restrictions || null,
      };
      console.log('Submitting profile data:', payloadToSubmit);
      const updatedProfile = await updateUserProfile(payloadToSubmit, token);
      processFetchedProfile(updatedProfile); // Update form and metabolic data with response
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

        {/* Basic User Info (Read-Only from AuthContext) */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
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
        </Grid>

        <Divider sx={{ my: 3 }}><Typography variant="overline">Metabolic Estimates</Typography></Divider>

        {/* Metabolic Data Display */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Age"
              value={metabolicData.age !== null ? `${metabolicData.age} years` : 'N/A'}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="filled"
              sx={{ bgcolor: 'grey.200' }}
              helperText={metabolicData.age === null ? "Enter date of birth to calculate" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="BMR (Basal Metabolic Rate)"
              value={metabolicData.bmr !== null ? metabolicData.bmr.toString() : 'N/A'}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: metabolicData.bmr !== null ? <InputAdornment position="end">cal/day</InputAdornment> : null
              }}
              variant="filled"
              sx={{ bgcolor: 'grey.200' }}
              helperText={metabolicData.bmr === null ? "Complete profile to calculate" : "Calories burned at rest"}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="TDEE (Total Daily Energy)"
              value={metabolicData.tdee !== null ? metabolicData.tdee.toString() : 'N/A'}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: metabolicData.tdee !== null ? <InputAdornment position="end">cal/day</InputAdornment> : null
              }}
              variant="filled"
              sx={{ bgcolor: 'grey.200' }}
              helperText={metabolicData.tdee === null ? "Complete profile to calculate" : "Total daily calories needed"}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }}><Typography variant="overline">Profile Details</Typography></Divider>

        <Box component="form" onSubmit={handleSaveClick} noValidate>
          <Grid container spacing={3}>
            {/* Profile Data (Editable) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="date_of_birth"
                label="Date of Birth"
                type="date"
                variant="outlined"
                value={profileData.date_of_birth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().split('T')[0] }}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" disabled={isLoading}>
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  labelId="gender-label"
                  name="gender"
                  value={profileData.gender}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {genderOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>Height Unit:</Typography>
                <ToggleButtonGroup
                  value={heightUnit}
                  exclusive
                  onChange={(_, newUnit) => newUnit && setHeightUnit(newUnit)}
                  size="small"
                  aria-label="height unit"
                >
                  <ToggleButton value="cm">CM</ToggleButton>
                  <ToggleButton value="ft">FT/IN</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {heightUnit === 'cm' ? (
                <TextField
                  fullWidth
                  name="cm"
                  label="Height (cm)"
                  type="number"
                  variant="outlined"
                  value={heightDisplay.cm}
                  onChange={handleHeightChange}
                  InputProps={{ inputProps: { min: 0, step: "1" } }}
                  disabled={isLoading}
                />
              ) : (
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      name="ft"
                      label="Feet"
                      type="number"
                      variant="outlined"
                      value={heightDisplay.ft}
                      onChange={handleHeightChange}
                      InputProps={{ inputProps: { min: 0, step: "1" } }}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      name="in"
                      label="Inches"
                      type="number"
                      variant="outlined"
                      value={heightDisplay.in}
                      onChange={handleHeightChange}
                      InputProps={{ inputProps: { min: 0, max: 11, step: "1" } }}
                      disabled={isLoading}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>Weight Unit:</Typography>
                <ToggleButtonGroup
                  value={weightUnit}
                  exclusive
                  onChange={(_, newUnit) => newUnit && setWeightUnit(newUnit)}
                  size="small"
                  aria-label="weight unit"
                >
                  <ToggleButton value="kg">KG</ToggleButton>
                  <ToggleButton value="lbs">LBS</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <TextField
                fullWidth
                name={weightUnit}
                label={`Weight (${weightUnit})`}
                type="number"
                variant="outlined"
                value={weightUnit === 'kg' ? weightDisplay.kg : weightDisplay.lbs}
                onChange={handleWeightChange}
                InputProps={{ inputProps: { min: 0, step: "0.1" } }}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" disabled={isLoading}>
                <InputLabel id="activity-level-label">Activity Level</InputLabel>
                <Select
                  labelId="activity-level-label"
                  name="activity_level"
                  value={profileData.activity_level}
                  onChange={handleChange}
                  label="Activity Level"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {activityLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="fitness_goals"
                label="Fitness Goals"
                multiline
                rows={3}
                variant="outlined"
                value={profileData.fitness_goals}
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
                value={profileData.dietary_restrictions}
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
                disabled={isLoading || isFetchingProfile || (originalProfileData !== null && JSON.stringify(profileData) === JSON.stringify(originalProfileData))}
                sx={{
                  bgcolor: '#283618ff',
                  '&:hover': { bgcolor: '#1e2a10ff' },
                  '&.Mui-disabled': { bgcolor: '#e0e0e0' }
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
          PaperProps={{ sx: { bgcolor: '#fefae0' } }}
        >
          <DialogTitle sx={{ color: '#283618ff', fontWeight: 'bold' }}>
            Confirm Changes
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: '#606c38ff', mb: 2 }}>
              Are you sure you want to submit the following changes?
            </DialogContentText>
            <List dense>
              {pendingChanges.map((change, index) => (
                <ListItem key={index}>
                  <Box component="span" sx={{ mr: 1, color: '#bc6c25ff', fontSize: '20px' }}>•</Box>
                  <ListItemText
                    primary={change}
                    primaryTypographyProps={{ color: '#283618ff' }}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenConfirmDialog(false)} sx={{ color: '#bc6c25ff' }}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              variant="contained"
              autoFocus
              sx={{ bgcolor: '#283618ff', '&:hover': { bgcolor: '#1e2a10ff' } }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default ProfilePage; 