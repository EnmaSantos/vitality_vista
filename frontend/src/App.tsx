// frontend/src/App.tsx corrected

import React from "react";
// BrowserRouter as Router REMOVED from here
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/food-log" element={<FoodLogPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
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