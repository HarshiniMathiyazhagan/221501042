import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  ThemeProvider,
  Typography,
  createTheme,
  Link,
} from '@mui/material';
import UrlShortenerForm from './components/UrlShortenerForm';
import UrlStatistics from './components/UrlStatistics';
import { UrlShorteningResponse } from './types';
import { urlService } from './services/UrlService';
import { logger } from './services/LoggingService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#F0D8B6',
    },
    secondary: {
      main: '#7b3f00',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
      textAlign: 'center',
      color: '#7b3f00',
    },
    h6: {
      fontWeight: 500,
      textAlign: 'center',
    },
  },
});

const NavigationTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Tabs
      value={location.pathname}
      onChange={handleChange}
      textColor="inherit"
      indicatorColor="secondary"
    >
      <Tab value="/" label="Shorten URLs" />
      <Tab value="/statistics" label="Statistics" />
    </Tabs>
  );
};

const App: React.FC = () => {
  const [shortenedUrls, setShortenedUrls] = useState<UrlShorteningResponse[]>([]);

  const handleUrlsShortened = (responses: UrlShorteningResponse[]) => {
    setShortenedUrls(responses);
    logger.info('URLs shortened successfully', { count: responses.length });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="primary" sx={{ mb: 4 }}>
            <Container>
              <Typography variant="h4" component="div" sx={{ py: 3, textTransform: 'uppercase' }}>
                Quick Short Link Generator
              </Typography>
              <NavigationTabs />
            </Container>
          </AppBar>

          <Container sx={{ mt: 4 }}>
            <Routes>
              <Route
                path="/"
                element={
                  <Box>
                    <UrlShortenerForm onUrlsShortened={handleUrlsShortened} />
                    {shortenedUrls.length > 0 && (
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                          Shortened URLs
                        </Typography>
                        {shortenedUrls.map((response, index) => (
                          <Box key={index} sx={{ mb: 2 }}>
                            <Typography variant="body1">
                              Original: {response.originalUrl}
                            </Typography>
                            <Typography variant="body1">
                              Shortened:{' '}
                              <Link
                                href="#"
                                onClick={() => window.open(response.shortUrl, '_blank')}
                                sx={{ cursor: 'pointer' }}
                              >
                                {response.shortUrl}
                              </Link>
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Expires: {new Date(response.expiryDate).toLocaleString()}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                }
              />
              <Route path="/statistics" element={<UrlStatistics />} />
              <Route path="/:shortCode" element={<RedirectComponent />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

const RedirectComponent: React.FC = () => {
  const navigate = useNavigate();
  const shortCode = window.location.pathname.slice(1);
  
  const urlData = urlService.getUrlData(shortCode);
  
  if (!urlData) {
    logger.error('URL not found for redirect', { shortCode });
    navigate('/');
    return null;
  }

  if (urlService.isUrlExpired(urlData)) {
    logger.warn('Attempted to access expired URL', { shortCode });
    navigate('/');
    return null;
  }

  urlService.recordClick(shortCode, 'Direct Access');
  logger.info('Redirecting to original URL', { shortCode, destination: urlData.longUrl });
  window.location.href = urlData.longUrl;
  return null;
};

export default App;
