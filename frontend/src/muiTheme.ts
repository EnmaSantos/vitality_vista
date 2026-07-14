import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d5d56',
      dark: '#073d38',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#083d77',
      dark: '#052a52',
      contrastText: '#ffffff',
    },
    background: {
      default: '#edf5f2',
      paper: '#ffffff',
    },
    text: {
      primary: '#073d38',
      secondary: '#5d716d',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      fontWeight: 750,
      letterSpacing: 0,
      textTransform: 'none',
    },
    h1: { fontWeight: 850, letterSpacing: '-0.04em' },
    h2: { fontWeight: 850, letterSpacing: '-0.035em' },
    h3: { fontWeight: 850, letterSpacing: '-0.03em' },
    h4: { fontWeight: 800, letterSpacing: '-0.025em' },
    h5: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 750, letterSpacing: '-0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 42,
          paddingInline: 18,
        },
        contained: {
          boxShadow: '0 8px 20px rgba(13, 93, 86, 0.16)',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid var(--vv-line)',
          backgroundImage: 'none',
          boxShadow: '0 10px 30px rgba(7, 61, 56, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        fullWidth: true,
      },
      styleOverrides: {
        paper: {
          border: '1px solid var(--vv-line)',
          borderRadius: 20,
          boxShadow: '0 30px 80px rgba(7, 61, 56, 0.18)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
        },
        indicator: {
          borderRadius: 999,
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          fontWeight: 750,
          textTransform: 'none',
        },
      },
    },
    MuiAccordion: {
      defaultProps: {
        elevation: 0,
        disableGutters: true,
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
        },
      },
    },
  },
});
