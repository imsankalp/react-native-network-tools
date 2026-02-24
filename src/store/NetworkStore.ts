import type {
  AnnotateNetworkRequestErrorInput,
  NetworkRequest,
  NetworkRequestCustomError,
} from '../context/types';

type NetworkStoreListener = (requests: NetworkRequest[]) => void;

class NetworkStore {
  private requests: NetworkRequest[] = [];
  private listeners = new Set<NetworkStoreListener>();
  private maxRequests: number = 1000;

  // Add a new request
  add(request: NetworkRequest): void {
    this.requests.unshift(request);

    // Only slice if we exceed the limit to avoid unnecessary array operations
    if (this.requests.length > this.maxRequests) {
      this.requests = this.requests.slice(0, this.maxRequests);
    }

    this.notifyListeners();
  }

  // Get all requests (returns a copy to prevent mutations)
  getAll(): NetworkRequest[] {
    return [...this.requests];
  }

  // Get request by ID
  getById(id: string): NetworkRequest | null {
    return this.requests.find((req) => req.id === id) || null;
  }

  // Attach a custom RN-side error to an existing request.
  // Priority: requestId match, otherwise latest url/method match.
  annotateRequestError(input: AnnotateNetworkRequestErrorInput): string | null {
    const requestIndex = this.findRequestIndexForError(input);
    if (requestIndex < 0) {
      return null;
    }

    const customError: NetworkRequestCustomError = {
      message: input.message,
      code: input.code,
      type: input.type ?? 'custom',
      details: input.details,
      source: 'react-native',
      timestamp: Date.now(),
    };

    const request = this.requests[requestIndex];
    if (!request) {
      return null;
    }
    request.customError = customError;
    request.error = input.message;

    this.notifyListeners();
    return request.id;
  }

  // Clear all requests
  clear(): void {
    this.requests = [];
    this.notifyListeners();
  }

  // Get request count
  getCount(): number {
    return this.requests.length;
  }

  // Set max requests limit
  setMaxRequests(max: number): void {
    this.maxRequests = max;
    if (this.requests.length > max) {
      this.requests = this.requests.slice(0, max);
      this.notifyListeners();
    }
  }

  // Subscribe to changes
  subscribe(listener: NetworkStoreListener): () => void {
    this.listeners.add(listener);

    // Immediately call listener with current state
    listener(this.getAll());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Batch operations to reduce notifications
  batch(operations: () => void): void {
    const originalNotify = this.notifyListeners;
    let shouldNotify = false;

    // Temporarily override notifyListeners to track if changes occurred
    this.notifyListeners = () => {
      shouldNotify = true;
    };

    try {
      operations();
    } finally {
      // Restore original notify function
      this.notifyListeners = originalNotify;

      // Only notify if changes occurred
      if (shouldNotify) {
        this.notifyListeners();
      }
    }
  }

  // Load initial data (useful for hydrating from native module)
  loadInitialData(requests: NetworkRequest[]): void {
    this.requests = requests.slice(0, this.maxRequests);
    this.notifyListeners();
  }

  private findRequestIndexForError(
    input: AnnotateNetworkRequestErrorInput
  ): number {
    if (input.requestId) {
      return this.requests.findIndex(
        (request) => request.id === input.requestId
      );
    }

    const normalizedMethod = input.method?.toUpperCase();
    const normalizedUrl = input.url?.toLowerCase();

    if (!normalizedMethod && !normalizedUrl) {
      return -1;
    }

    return this.requests.findIndex((request) => {
      const requestMethodMatches = normalizedMethod
        ? request.method?.toUpperCase() === normalizedMethod
        : true;

      const requestUrl = request.url?.toLowerCase() ?? '';
      const requestUrlMatches = normalizedUrl
        ? requestUrl === normalizedUrl || requestUrl.includes(normalizedUrl)
        : true;

      return requestMethodMatches && requestUrlMatches;
    });
  }

  private notifyListeners(): void {
    // Use requestAnimationFrame to batch updates and prevent excessive re-renders
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        const currentRequests = this.getAll();
        this.listeners.forEach((listener) => listener(currentRequests));
      });
    } else {
      // Fallback for environments without requestAnimationFrame
      const currentRequests = this.getAll();
      this.listeners.forEach((listener) => listener(currentRequests));
    }
  }
}

export const networkStore = new NetworkStore();
