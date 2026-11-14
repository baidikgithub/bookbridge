import { API_BASE_URL } from '../constants/config';

// Stored covers are server paths like /uploads/abc.jpg; local photos are file:// URIs.
export const imageUri = (uri: string | null | undefined) => (uri && uri.startsWith('/') ? API_BASE_URL + uri : uri ?? null);
