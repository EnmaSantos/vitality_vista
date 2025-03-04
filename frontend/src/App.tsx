import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ExercisesPage from "./pages/Exercises";
import FoodLogPage from "./pages/FoodLog";
import ProgressPage from "./pages/Progress";
import RecipesPage from "./pages/Recipes";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import { ThemeProvider } from './context/ThemeContext';
import "./App.css";

// Create a layout component that will handle the navbar logic
const AppLayout = () => {
  const location = useLocation(); // Use useLocation hook from react-router
  
  // List of routes where navbar should be hidden
  const noNavbarRoutes = ['/login', '/signup', '/forgot-password', '/landing'];
  
  // Check if current path is in the noNavbarRoutes list
  const hideNavbar = noNavbarRoutes.includes(location.pathname);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Only render Navbar when not on authentication pages */}
      {!hideNavbar && <Navbar />}
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          {/* Public routes - no authentication checks */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* App routes - no authentication required for testing */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} /> {/* Added explicit dashboard route */}
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/food-log" element={<FoodLogPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          
          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppLayout />
      </Router>
    </ThemeProvider>
  );
}

export default App;