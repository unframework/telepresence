import React from 'react';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Box from '@material-ui/core/Box';

const muiTheme = createMuiTheme({
  palette: {
    primary: { main: '#f88' },
    secondary: { main: '#8f8' }
  }
});

const PageContainer: React.FC = ({ children }) => {
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />

      {children}
    </MuiThemeProvider>
  );
};

export default PageContainer;
