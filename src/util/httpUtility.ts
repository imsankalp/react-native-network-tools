import { HttpMethod } from '../config/httpMethodConfig';

/**
 * Type guard to check if a string is a valid HTTP method
 * @param method - The string to check
 * @returns boolean indicating if the string is a valid HTTP method
 */
export function isHttpMethod(method: string): method is HttpMethod {
  return Object.values(HttpMethod).includes(method as HttpMethod);
}

/**
 * Safely converts a string to an HttpMethod enum value.
 * Returns undefined if the string doesn't match any HttpMethod.
 * @param method - The string to convert
 * @returns The corresponding HttpMethod or undefined
 */
export function toHttpMethod(method: string): HttpMethod | undefined {
  return isHttpMethod(method) ? method : undefined;
}
