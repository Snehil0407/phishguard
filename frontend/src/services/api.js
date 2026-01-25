import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeEmail = async (content, subject = '', senderEmail = '') => {
  const payload = { 
    content, 
    subject
  };
  
  // Only include sender_email if provided
  if (senderEmail && senderEmail.trim()) {
    payload.sender_email = senderEmail.trim();
  }
  
  const response = await api.post('/analyze/email', payload);
  return response.data;
};

export const analyzeSMS = async (message) => {
  const response = await api.post('/analyze/sms', { message });
  return response.data;
};

export const analyzeURL = async (url) => {
  const response = await api.post('/analyze/url', { url });
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
