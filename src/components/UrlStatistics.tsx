import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Link,
  Collapse,
  IconButton,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { format } from 'date-fns';
import { UrlData } from '../types';
import { urlService } from '../services/UrlService';
import { logger } from '../services/LoggingService';

const UrlStatistics: React.FC = () => {
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUrls = () => {
      try {
        const allUrls = urlService.getAllUrls();
        setUrls(allUrls);
        logger.info('Loaded URL statistics', { count: allUrls.length });
      } catch (error) {
        logger.error('Failed to load URL statistics', { error });
      }
    };

    loadUrls();
    const interval = setInterval(loadUrls, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleUrlClick = async (shortCode: string) => {
    try {
      const urlData = urlService.getUrlData(shortCode);
      if (!urlData) {
        logger.error('URL not found', { shortCode });
        return;
      }

      if (urlService.isUrlExpired(urlData)) {
        logger.warn('Attempted to access expired URL', { shortCode });
        return;
      }

      urlService.recordClick(shortCode, 'Statistics Page');
      window.open(urlData.longUrl, '_blank');
      logger.info('URL accessed from statistics page', { shortCode });
    } catch (error) {
      logger.error('Error handling URL click', { shortCode, error });
    }
  };

  const toggleExpand = (shortCode: string) => {
    setExpandedUrl(expandedUrl === shortCode ? null : shortCode);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        URL Statistics
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Short URL</TableCell>
              <TableCell>Original URL</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Expires At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Total Clicks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {urls.map((url) => {
              const isExpired = urlService.isUrlExpired(url);
              const isExpanded = expandedUrl === url.shortCode;

              return (
                <React.Fragment key={url.shortCode}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleExpand(url.shortCode!)}
                      >
                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Link
                        href="#"
                        onClick={() => handleUrlClick(url.shortCode!)}
                        color={isExpired ? 'error' : 'primary'}
                        underline="hover"
                      >
                        {`localhost:3000/${url.shortCode}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {url.longUrl}
                      </Typography>
                    </TableCell>
                    <TableCell>{format(new Date(url.createdAt), 'PPp')}</TableCell>
                    <TableCell>{format(new Date(url.expiryDate), 'PPp')}</TableCell>
                    <TableCell>
                      <Chip
                        label={isExpired ? 'Expired' : 'Active'}
                        color={isExpired ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{url.clicks.length}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          <Typography variant="h6" gutterBottom component="div">
                            Click History
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>Source</TableCell>
                                <TableCell>Location</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {url.clicks.map((click, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {format(new Date(click.timestamp), 'PPp')}
                                  </TableCell>
                                  <TableCell>{click.source}</TableCell>
                                  <TableCell>{click.location}</TableCell>
                                </TableRow>
                              ))}
                              {url.clicks.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={3} align="center">
                                    No clicks recorded yet
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
            {urls.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No URLs have been shortened yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UrlStatistics;