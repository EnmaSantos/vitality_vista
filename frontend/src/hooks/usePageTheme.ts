import { useEffect } from 'react';

// Define the Vitality Vista palette for easy reference
export const themePalette = {
    green: {
        primary: '#606c38',
        primaryDark: '#283618',
        secondary: '#bc6c25',
        accent: '#dda15e',
    },
    orange: {
        primary: '#bc6c25', // Tigers Eye
        primaryDark: '#9c561b', // Darker Tigers Eye (Custom generated)
        secondary: '#606c38',
        accent: '#dda15e',
    },
    gold: {
        primary: '#dda15e', // Earth Yellow
        primaryDark: '#b67f3c', // Darker Earth Yellow
        secondary: '#283618',
        accent: '#bc6c25',
    },
    darkGreen: {
        primary: '#283618', // Pakistan Green
        primaryDark: '#1a2310',
        secondary: '#606c38',
        accent: '#dda15e',
    }
};

/**
 * Hook to set the page theme colors by updating CSS variables.
 * @param theme The theme object containing primary, primaryDark, etc.
 */
export const usePageTheme = (theme: typeof themePalette.green) => {
    useEffect(() => {
        void theme;
    }, [theme]);
};
