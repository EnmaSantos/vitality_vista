// frontend/src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook
import { Box, CircularProgress } from '@mui/material'; // For loading state UI

interface ProtectedRouteProps {
  children: React.ReactElement; // The component to render if authenticated (e.g., <Dashboard />)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Get the authentication status and loading state from the context
  // const { isAuthenticated, isLoading } = useAuth();
  // const location = useLocation(); // Get the current location

  // // 1. Handle Initial Loading State
  // // While the AuthContext is checking localStorage on initial load, show a spinner
  // if (isLoading) {
  //   console.log("ProtectedRoute: Auth context is loading...");
  //   return (
  //     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  // // 2. Handle Not Authenticated State
  // // If not loading AND not authenticated, redirect to the login page
  // if (!isAuthenticated) {
  //   console.log('ProtectedRoute: User not authenticated, redirecting to login.');
  //   // Use the Navigate component for declarative redirect
  //   // state={{ from: location }} preserves the intended destination URL
  //   // replace={true} replaces the current entry in history stack
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  // // 3. Handle Authenticated State
  // // If loading is finished and user is authenticated, render the child component
  // console.log('ProtectedRoute: User authenticated, rendering children.');
  return children; // Always render children
};

export default ProtectedRoute;