import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface CustomThemeProviderProps {
  children: React.ReactNode;
}

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Set data-theme attribute for custom scrollbar styling
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#EF5B5B', // Đỏ hồng chủ đạo
        light: '#FF7B7B', // Hồng cam nhạt
        dark: '#D94A4A', // Đỏ đậm hơn
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#AED6E6', // Xanh da trời nhạt
        light: '#D1E7F0',
        dark: '#7BB3D1',
        contrastText: '#333333',
      },
      background: {
        default: darkMode ? '#1a1a1a' : '#FFFFFF', // Trắng
        paper: darkMode ? '#2d2d2d' : '#FFFFFF',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#333333', // Đen xám đậm
        secondary: darkMode ? '#b0b0b0' : '#777777', // Xám nhạt
      },
      error: {
        main: '#EF5B5B',
        light: '#FF7B7B',
        dark: '#D94A4A',
      },
      warning: {
        main: '#FF7B7B',
      },
      info: {
        main: '#AED6E6',
      },
      success: {
        main: '#4CAF50',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Open Sans", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        color: darkMode ? '#ffffff' : '#333333',
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
        color: darkMode ? '#ffffff' : '#333333',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        color: darkMode ? '#ffffff' : '#333333',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        color: darkMode ? '#ffffff' : '#333333',
      },
      h5: {
        fontWeight: 500,
        fontSize: '1.25rem',
        color: darkMode ? '#ffffff' : '#333333',
      },
      h6: {
        fontWeight: 500,
        fontSize: '1rem',
        color: darkMode ? '#ffffff' : '#333333',
      },
      body1: {
        color: darkMode ? '#ffffff' : '#333333',
      },
      body2: {
        color: darkMode ? '#b0b0b0' : '#777777',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: darkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
              : '0 4px 20px rgba(239, 91, 91, 0.1)',
            border: darkMode ? '1px solid #2d2d2d' : '1px solid rgba(239, 91, 91, 0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: darkMode 
                ? '0 8px 30px rgba(0, 0, 0, 0.4)' 
                : '0 8px 30px rgba(239, 91, 91, 0.2)',
              border: darkMode ? '1px solid #3d3d3d' : '1px solid rgba(239, 91, 91, 0.2)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 500,
            padding: '10px 20px',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            boxShadow: '0 4px 15px rgba(239, 91, 91, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(239, 91, 91, 0.4)',
            },
          },
          outlined: {
            borderWidth: '2px',
            '&:hover': {
              borderWidth: '2px',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            fontWeight: 500,
          },
          colorPrimary: {
            backgroundColor: '#EF5B5B',
            color: '#FFFFFF',
          },
          colorSecondary: {
            backgroundColor: '#AED6E6',
            color: '#333333',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#EF5B5B',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#EF5B5B',
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
