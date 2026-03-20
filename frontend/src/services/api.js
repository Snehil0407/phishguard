import axios from 'axios';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const waitForAuthUser = async (timeoutMs = 1500) => {
  if (auth.currentUser) return auth.currentUser;

  return await new Promise((resolve) => {
    let settled = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!settled) {
        settled = true;
        unsubscribe();
        resolve(user || null);
      }
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        unsubscribe();
        resolve(null);
      }
    }, timeoutMs);
  });
};

api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser || await waitForAuthUser();

  config.headers = config.headers || {};

  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
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
