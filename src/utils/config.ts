export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

// Base URL for uploads (strip trailing /api if present)
export const UPLOADS_BASE = API_BASE_URL.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export default { API_BASE_URL, UPLOADS_BASE };
