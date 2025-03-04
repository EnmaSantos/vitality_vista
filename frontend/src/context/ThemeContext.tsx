import React, { createContext, useState, useContext, ReactNode } from 'react';

// Color palette
export const themeColors = {
  darkMossGreen: '#606c38ff',
  pakistanGreen: '#283618ff',
  cornsilk: '#fefae0ff',
  earthYellow: '#dda15eff',
  tigersEye: '#bc6c25ff',
};

interface ThemeContextType {
  currentThemeColor: string;
  setCurrentThemeColor: (color: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentThemeColor, setCurrentThemeColor] = useState(themeColors.pakistanGreen);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ 
      currentThemeColor, 
      setCurrentThemeColor, 
      darkMode, 
      toggleDarkMode 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};