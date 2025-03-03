import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import "./App.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar is now always visible */}
        <Navbar />
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            {/* Public routes - no authentication checks */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Routes without authentication requirements */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/food-log" element={<FoodLogPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            
            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;