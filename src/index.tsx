import NetworkTools from './NativeNetworkTools';
/**
 * Enable network request tracking
 * This should be called during app initialization
 * Note: Only works in debug builds
 */
export function enable(): void {
  NetworkTools.enable();
}

/**
 * Disable network request tracking
 */
export function disable(): void {
  NetworkTools.disable();
}

/**
 * Check if network tracking is currently enabled
 */
export function isEnabled(): boolean {
  return NetworkTools.isEnabled();
}

/**
 * Get all captured network requests
 * @returns Array of NetworkRequest objects
 */
export function getAllRequests() {
  const jsonString = NetworkTools.getAllRequests();
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return [];
  }
}

/**
 * Get a specific network request by ID
 * @param id - The unique identifier of the request
 * @returns NetworkRequest object or null if not found
 */
export function getRequestById(id: string) {
  const jsonString = NetworkTools.getRequestById(id);
  try {
    const parsed = JSON.parse(jsonString);
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch (e) {
    return null;
  }
}

/**
 * Clear all stored network requests
 */
export function clearAllRequests(): void {
  NetworkTools.clearAllRequests();
}

/**
 * Get the count of stored network requests
 * @returns Number of stored requests
 */
export function getRequestCount(): number {
  return NetworkTools.getRequestCount();
}
