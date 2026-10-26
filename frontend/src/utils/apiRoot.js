// Single place the API address is configured.
// Override per environment with REACT_APP_API_URL in frontend/.env
export const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const API = `${API_ROOT}/api`;
