const rawApiBaseUrl = import.meta.env.VITE_API_URL || '';
const normalizedApiBaseUrl = rawApiBaseUrl === '/' ? '' : rawApiBaseUrl.replace(/\/$/, '');
export const API_BASE_URL = normalizedApiBaseUrl;
