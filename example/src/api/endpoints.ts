// Base API URL - JSONPlaceholder fake REST API
const BASE_URL = 'https://jsonplaceholder.typicode.com';

export const ENDPOINTS = {
  // Posts endpoints
  GET_POSTS: `${BASE_URL}/posts`,
  GET_POST: (id: number) => `${BASE_URL}/posts/${id}`,
  CREATE_POST: `${BASE_URL}/posts`,
  UPDATE_POST: (id: number) => `${BASE_URL}/posts/${id}`,
  DELETE_POST: (id: number) => `${BASE_URL}/posts/${id}`,

  // Comments endpoints
  GET_COMMENTS: `${BASE_URL}/comments`,
  GET_POST_COMMENTS: (postId: number) => `${BASE_URL}/posts/${postId}/comments`,

  // Users endpoints
  GET_USERS: `${BASE_URL}/users`,
  GET_USER: (id: number) => `${BASE_URL}/users/${id}`,

  // Albums endpoints
  GET_ALBUMS: `${BASE_URL}/albums`,
  GET_USER_ALBUMS: (userId: number) => `${BASE_URL}/users/${userId}/albums`,

  // Photos endpoints
  GET_PHOTOS: `${BASE_URL}/photos`,
  GET_ALBUM_PHOTOS: (albumId: number) => `${BASE_URL}/albums/${albumId}/photos`,

  // Todos endpoints
  GET_TODOS: `${BASE_URL}/todos`,
  GET_USER_TODOS: (userId: number) => `${BASE_URL}/users/${userId}/todos`,
};

export type ApiEndpoints = typeof ENDPOINTS;
