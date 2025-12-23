import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#00D2FF', // Electric Blue
      light: '#6ADBFF',
      dark: '#0097BB',
    },
    secondary: {
      main: '#9D50BB', // Purple
      light: '#BE8AD3',
      dark: '#6E2791',
    },
    background: {
      default: mode === 'dark' ? '#0A192F' : '#F4F7FA',
      paper: mode === 'dark' ? '#112240' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#CCD6F6' : '#1A202C',
      secondary: mode === 'dark' ? '#8892B0' : '#4A5568',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '1rem',
          backdropFilter: 'blur(8px)',
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #00D2FF 30%, #3A7BD5 90%)',
          boxShadow: mode === 'dark' ? '0 3px 5px 2px rgba(0, 210, 255, .3)' : '0 3px 5px 2px rgba(0, 210, 255, .1)',
          color: '#FFFFFF', // Constant white text
          '&:hover': {
            background: 'linear-gradient(45deg, #3A7BD5 30%, #00D2FF 90%)',
          }
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    }
  },
});

export default getTheme;
