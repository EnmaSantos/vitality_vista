// frontend/src/index.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom'; // <-- Import BrowserRouter

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* Wrap with BrowserRouter first */}
    <BrowserRouter>
      {/* Then wrap with AuthProvider */}
      <AuthProvider>
        {/* Finally, render your App */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);