import React, { useState } from "react";
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
  // Mock authentication state - in a real app, this would be managed with a proper auth system
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Only show Navbar on authenticated routes */}
        {isAuthenticated && <Navbar />}
        
        <main className={isAuthenticated ? "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" : ""}>
          <Routes>
            {/* Public routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/signup" element={<Signup setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected routes */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/landing" replace />} 
            />
            <Route 
              path="/exercises" 
              element={isAuthenticated ? <ExercisesPage /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/food-log" 
              element={isAuthenticated ? <FoodLogPage /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/progress" 
              element={isAuthenticated ? <ProgressPage /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/recipes" 
              element={isAuthenticated ? <RecipesPage /> : <Navigate to="/login" replace />} 
            />
            
            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/landing"} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;