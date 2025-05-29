import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Note: jest-dom matchers are now globally available via setupTests.ts
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import ProfilePage from './ProfilePage';
import * as AuthContext from '../context/AuthContext';
import * as ThemeContextHooks from '../context/ThemeContext';
import * as profileApi from '../services/profileApi';

// Mock an MUI theme
const theme = createTheme();

// Mock dependencies
vi.mock('../context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthContext>();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

vi.mock('../context/ThemeContext', async (importOriginal) => {
    const actual = await importOriginal<typeof ThemeContextHooks>();
    return {
        ...actual,
        useThemeContext: vi.fn(),
    };
});

vi.mock('../services/profileApi', async (importOriginal) => {
  const actual = await importOriginal<typeof profileApi>();
  return {
    ...actual,
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
  };
});

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
};

const mockProfileData = {
  date_of_birth: '1990-01-01',
  height_cm: 170,
  weight_kg: 65,
  gender: 'male',
  activity_level: 'moderate',
  fitness_goals: 'get stronger',
  dietary_restrictions: 'none',
  // Calculated fields
  age: 34,
  bmr: 1600,
  tdee: 2400,
};

describe('ProfilePage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Setup default mock implementations
    (AuthContext.useAuth as vi.Mock).mockReturnValue({
      user: mockUser,
      token: 'fake-token',
      isAuthInitialized: true,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerificationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      resetPassword: vi.fn(),
      loading: false,
      error: null,
      successMessage: null,
      clearMessages: vi.fn(),
    });
    (ThemeContextHooks.useThemeContext as vi.Mock).mockReturnValue({
        currentThemeColor: 'default',
        setCurrentThemeColor: vi.fn(),
    });
    (profileApi.getUserProfile as vi.Mock).mockResolvedValue(mockProfileData);
    (profileApi.updateUserProfile as vi.Mock).mockImplementation(async (data, _token) => {
        return Promise.resolve({ ...mockProfileData, ...data });
    });
  });

  it('should allow updating height and weight with float values and send them as numbers', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <ProfilePage />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Wait for initial profile data to load and fields to be populated
    await waitFor(() => {
      expect(screen.getByLabelText(/Height \(cm\)/i)).toHaveValue(mockProfileData.height_cm);
    });
    
    const heightInput = screen.getByLabelText(/Height \(cm\)/i) as HTMLInputElement;
    const weightInput = screen.getByLabelText(/Weight \(kg\)/i) as HTMLInputElement;
    const saveButton = screen.getByRole('button', { name: /Save Profile/i });

    // Simulate user input with float values
    fireEvent.change(heightInput, { target: { value: '175.5' } });
    fireEvent.change(weightInput, { target: { value: '68.75' } });

    // Check if inputs display the typed string value correctly
    expect(heightInput.value).toBe('175.5');
    expect(weightInput.value).toBe('68.75');

    fireEvent.click(saveButton);

    // Wait for API call and potential UI updates
    await waitFor(() => {
      expect(profileApi.updateUserProfile).toHaveBeenCalledTimes(1);
    });

    // Verify that updateUserProfile was called with numbers
    expect(profileApi.updateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        height_cm: 175.5, // Expect number
        weight_kg: 68.75, // Expect number
      }),
      'fake-token'
    );
    
    // Optional: Verify that the input fields still show the correct values after "save"
    // This depends on how the component updates its state after API call
    // In this ProfilePage, it re-fetches or uses the returned updatedProfile.
    // Let's assume the mockResolvedValue of updateUserProfile returns the updated data.
    await waitFor(() => {
        expect(screen.getByLabelText(/Height \(cm\)/i)).toHaveValue(175.5);
        expect(screen.getByLabelText(/Weight \(kg\)/i)).toHaveValue(68.75);
    });
  });

  it('should set height and weight to null if fields are cleared', async () => {
    (profileApi.getUserProfile as vi.Mock).mockResolvedValue({
        ...mockProfileData,
        height_cm: 180, // start with some values
        weight_kg: 75,
    });

    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <ProfilePage />
        </ThemeProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Height \(cm\)/i)).toHaveValue(180);
    });

    const heightInput = screen.getByLabelText(/Height \(cm\)/i);
    const weightInput = screen.getByLabelText(/Weight \(kg\)/i);
    const saveButton = screen.getByRole('button', { name: /Save Profile/i });

    fireEvent.change(heightInput, { target: { value: '' } });
    fireEvent.change(weightInput, { target: { value: '' } });
    
    expect((heightInput as HTMLInputElement).value).toBe('');
    expect((weightInput as HTMLInputElement).value).toBe('');

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileApi.updateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          height_cm: null,
          weight_kg: null,
        }),
        'fake-token'
      );
    });
    
    // After saving null, the inputs should be empty (value={profileData.height_cm ?? ''})
    expect(screen.getByLabelText(/Height \(cm\)/i)).toHaveValue(null); // Or .toBe('') depending on how RTL handles null value for number input
    expect(screen.getByLabelText(/Weight \(kg\)/i)).toHaveValue(null);
  });
});

