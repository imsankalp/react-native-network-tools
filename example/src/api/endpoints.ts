// Base API URL - points to our mock server
const BASE_URL = 'http://localhost:3000';

export const ENDPOINTS = {
  // Posts endpoints
  GET_POSTS: `${BASE_URL}/api/posts`,
  GET_POST: (id: number) => `${BASE_URL}/api/posts/${id}`,

  // Auth endpoints
  LOGIN: `${BASE_URL}/api/login`,

  // Protected endpoints
  PROTECTED: `${BASE_URL}/api/protected`,

  // Helper functions to add query params
  withDelay: (url: string, delay: number) => `${url}?delay=${delay}`,
  withStatus: (url: string, status: number) =>
    `${url}${url.includes('?') ? '&' : '?'}status=${status}`,
  withLargePayload: (url: string) =>
    `${url}${url.includes('?') ? '&' : '?'}large=true`,
};

export type ApiEndpoints = typeof ENDPOINTS;
