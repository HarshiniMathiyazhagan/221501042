import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { UrlFormData, UrlShorteningResponse } from '../types';
import { urlService } from '../services/UrlService';
import { logger } from '../services/LoggingService';

interface Props {
  onUrlsShortened: (responses: UrlShorteningResponse[]) => void;
}

const UrlShortenerForm: React.FC<Props> = ({ onUrlsShortened }) => {
  const [urlForms, setUrlForms] = useState<UrlFormData[]>([{ longUrl: '', shortCode: '', validityMinutes: 30 }]);
  const [error, setError] = useState<string>('');

  const addUrlForm = () => {
    if (urlForms.length >= 5) {
      setError('Maximum 5 URLs allowed at once');
      return;
    }
    setUrlForms([...urlForms, { longUrl: '', shortCode: '', validityMinutes: 30 }]);
    setError('');
  };

  const removeUrlForm = (index: number) => {
    setUrlForms(urlForms.filter((_, i) => i !== index));
    setError('');
  };

  const handleInputChange = (index: number, field: keyof UrlFormData, value: string) => {
    const newUrlForms = [...urlForms];
    if (field === 'validityMinutes') {
      newUrlForms[index][field] = value ? parseInt(value) : undefined;
    } else {
      newUrlForms[index][field] = value;
    }
    setUrlForms(newUrlForms);
    setError('');
  };

  const validateInputs = (): boolean => {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+\.)+[a-z.]{2,6}([/\w .-]*)*\/?$/;
    const shortCodeRegex = /^[a-zA-Z0-9]{3,10}$/;

    for (const form of urlForms) {
      if (!form.longUrl || !urlRegex.test(form.longUrl)) {
        setError('Please enter valid URLs');
        return false;
      }

      if (form.shortCode && !shortCodeRegex.test(form.shortCode)) {
        setError('Short codes must be 3-10 alphanumeric characters');
        return false;
      }

      if (form.validityMinutes !== undefined && (form.validityMinutes <= 0 || isNaN(form.validityMinutes))) {
        setError('Validity period must be a positive number');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateInputs()) return;

    try {
      logger.info('Attempting to shorten multiple URLs', { count: urlForms.length });
      
      const responses: UrlShorteningResponse[] = [];
      for (const form of urlForms) {
        const response = urlService.shortenUrl(form);
        responses.push(response);
      }

      onUrlsShortened(responses);
      setUrlForms([{ longUrl: '', shortCode: '', validityMinutes: 30 }]);
      logger.info('Successfully shortened all URLs', { count: responses.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to shorten URLs';
      logger.error('Error shortening URLs', { error: errorMessage });
      setError(errorMessage);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <Stack spacing={3}>
        {error && <Alert severity="error" sx={{ textAlign: 'center' }}>{error}</Alert>}

        <Typography variant="h5" sx={{ textAlign: 'center', mb: 2, color: 'secondary.main' }}>
          Create Short Links Instantly
        </Typography>

        {urlForms.map((form, index) => (
          <Card key={index} variant="outlined" sx={{ backgroundColor: 'white', boxShadow: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ color: 'secondary.main' }}>Link #{index + 1}</Typography>
                  {urlForms.length > 1 && (
                    <IconButton onClick={() => removeUrlForm(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <TextField
                  fullWidth
                  label="Enter Your Long URL"
                  value={form.longUrl}
                  onChange={(e) => handleInputChange(index, 'longUrl', e.target.value)}
                  placeholder="https://example.com"
                  required
                  sx={{ '& .MuiInputLabel-root': { fontSize: '1rem' } }}
                />

                <TextField
                  fullWidth
                  label="Custom Short Code"
                  value={form.shortCode}
                  onChange={(e) => handleInputChange(index, 'shortCode', e.target.value)}
                  placeholder="e.g., mylink123"
                  helperText="3-10 alphanumeric characters (optional)"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '1rem' } }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Link Validity (minutes)"
                  value={form.validityMinutes}
                  onChange={(e) => handleInputChange(index, 'validityMinutes', e.target.value)}
                  placeholder="30"
                  helperText="Default: 30 minutes"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '1rem' } }}
                />
              </Stack>
            </CardContent>
          </Card>
        ))}

        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 4 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={addUrlForm}
            disabled={urlForms.length >= 5}
            variant="outlined"
            color="secondary"
            size="large"
            sx={{ borderRadius: 2 }}
          >
            Add Another Link
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={urlForms.length === 0}
            size="large"
            sx={{ borderRadius: 2, px: 4 }}
          >
            Generate Short Links
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default UrlShortenerForm;