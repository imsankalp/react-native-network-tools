import type { UrlDetails } from './types';

/**
 * Parses a URL string and extracts its components.
 * * @param urlString - The full URL string to parse.
 * @param routePattern - (Optional) The route pattern (e.g., "/users/:id") used to extract path parameters.
 * @returns UrlDetails object containing components and a flag for query params.
 * @throws Error if the URL is invalid.
 */
export const parseUrlDetails = (
  urlString: string,
  routePattern?: string
): UrlDetails => {
  try {
    const url = new URL(urlString);

    // 1. Base URL: Protocol + Host
    const baseUrl = url.origin;

    // 2. End Point: The path section
    const endpoint = url.pathname;

    // 3. Query Params
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Check if any query params were found
    const isQueryParamsPresent = Object.keys(queryParams).length > 0;

    // 4. Path Params
    const pathParams: Record<string, string> = {};

    if (routePattern) {
      const routeSegments = routePattern.split('/').filter(Boolean);
      const urlSegments = endpoint.split('/').filter(Boolean);

      if (routeSegments.length === urlSegments.length) {
        routeSegments.forEach((segment, index) => {
          if (segment.startsWith(':')) {
            const paramName = segment.slice(1);
            pathParams[paramName] = urlSegments[index] ?? '';
          }
        });
      }
    }

    return {
      baseUrl,
      endpoint,
      queryParams,
      pathParams,
      isQueryParamsPresent,
    };
  } catch (error) {
    throw new Error(`Failed to parse URL: ${(error as Error).message}`);
  }
};
