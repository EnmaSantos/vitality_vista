// frontend/src/App.tsx corrected

import React from "react";
// BrowserRouter as Router REMOVED from here
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute"; // Import the ProtectedRoute component
import {
  Dashboard,
  ExercisesPage,
  FoodLogPage,
  ProgressPage,
  RecipesPage,
  Landing,
  Login,
  Signup,
  ForgotPassword,
  ProfilePage // Import ProfilePage
} from "./pages"; // Import from index.ts
import { ThemeProvider } from './context/ThemeContext'; // Assuming you also have ThemeProvider
import "./App.css";

// AppLayout component remains the same
const AppLayout = () => {
  const location = useLocation();
  const noNavbarRoutes = ['/login', '/signup', '/forgot-password', '/landing'];
  const hideNavbar = noNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavbar && <Navbar />}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Routes are defined here, inside AppLayout */}
        <Routes>
          {/* --- Public Routes (Remain Unchanged) --- */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* --- Protected Routes (Wrap element with ProtectedRoute) --- */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/exercises" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
          <Route path="/food-log" element={<ProtectedRoute><FoodLogPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
          {/* Added Profile Page Route */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          
          {/* --- Fallback Route (Remains Unchanged) --- */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// App component NOW ONLY returns ThemeProvider and AppLayout
function App() {
  return (
    <ThemeProvider>
      {/* No <Router> here anymore! It's in index.tsx */}
      <AppLayout />
    </ThemeProvider>
  );
}

export default App;