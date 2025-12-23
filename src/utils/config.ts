const envApi = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const origin = typeof window !== 'undefined' ? window.location.origin : '';

// Prefer VITE_API_URL if provided; otherwise derive from window.origin
export const API_BASE_URL = envApi && envApi.length > 0
	? envApi
	: (origin ? `${origin}/api` : 'http://localhost:5000/api');

// Base URL for uploads (strip trailing /api if present)
export const UPLOADS_BASE = API_BASE_URL.replace(/\/api\/?$/, '') || (origin || 'http://localhost:5000');

export default { API_BASE_URL, UPLOADS_BASE };
