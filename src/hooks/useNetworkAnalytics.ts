import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useNetworkMonitor } from '../context/NetworkMonitorContext';
import {
  networkAnalytics,
  type NetworkFilter,
  type NetworkStats,
} from '../analytics/NetworkAnalytics';
import type { NetworkRequest } from '../context/types';

interface UseNetworkAnalyticsResult {
  stats: NetworkStats;
  filterRequests: (filter: NetworkFilter) => NetworkRequest[];
  getTopDomains: (
    limit?: number
  ) => Array<{ domain: string; count: number; percentage: number }>;
  getErrorAnalysis: () => {
    errorsByStatus: Record<number, number>;
    errorsByDomain: Record<string, number>;
    commonErrors: Array<{ error: string; count: number }>;
  };
  getPerformanceInsights: () => {
    slowRequests: NetworkRequest[];
    fastRequests: NetworkRequest[];
    averageByDomain: Record<string, number>;
    performanceScore: number;
  };
  refresh: () => void;
}

/**
 * React hook wrapper for NetworkAnalytics class
 * Provides memoized analytics results and automatic updates when requests change
 */
export const useNetworkAnalytics = (): UseNetworkAnalyticsResult => {
  const { requests } = useNetworkMonitor();
  const lastRequestsRef = useRef<NetworkRequest[]>([]);
  const statsRef = useRef<NetworkStats | null>(null);

  // Update analytics when requests change
  useEffect(() => {
    if (requests !== lastRequestsRef.current) {
      networkAnalytics.updateRequests(requests);
      lastRequestsRef.current = requests;
      statsRef.current = null; // Invalidate cached stats
    }
  }, [requests]);

  // Memoized stats calculation
  const stats = useMemo(() => {
    if (!statsRef.current) {
      statsRef.current = networkAnalytics.getStats();
    }
    return statsRef.current;
  }, []);

  // Memoized filter function
  const filterRequests = useCallback((filter: NetworkFilter) => {
    return networkAnalytics.filterRequests(filter);
  }, []);

  // Memoized top domains function
  const getTopDomains = useCallback((limit: number = 10) => {
    return networkAnalytics.getTopDomains(limit);
  }, []);

  // Memoized error analysis function
  const getErrorAnalysis = useCallback(() => {
    return networkAnalytics.getErrorAnalysis();
  }, []);

  // Memoized performance insights function
  const getPerformanceInsights = useCallback(() => {
    return networkAnalytics.getPerformanceInsights();
  }, []);

  // Force refresh function
  const refresh = useCallback(() => {
    networkAnalytics.updateRequests(requests);
    statsRef.current = null;
  }, [requests]);

  return {
    stats,
    filterRequests,
    getTopDomains,
    getErrorAnalysis,
    getPerformanceInsights,
    refresh,
  };
};

/**
 * Hook for filtered analytics based on specific criteria
 */
export const useFilteredNetworkAnalytics = (
  filter: NetworkFilter
): UseNetworkAnalyticsResult & {
  filteredRequests: NetworkRequest[];
  filteredCount: number;
} => {
  const { requests } = useNetworkMonitor();

  // Memoize filtered requests
  const filteredRequests = useMemo(() => {
    networkAnalytics.updateRequests(requests);
    return networkAnalytics.filterRequests(filter);
  }, [requests, filter]);

  // Create temporary analytics instance for filtered data
  const filteredAnalytics = useMemo(() => {
    const tempAnalytics = new (networkAnalytics.constructor as any)();
    tempAnalytics.updateRequests(filteredRequests);
    return tempAnalytics;
  }, [filteredRequests]);

  const stats = useMemo(() => {
    return filteredAnalytics.getStats();
  }, [filteredAnalytics]);

  const filterRequestsCallback = useCallback(
    (additionalFilter: NetworkFilter) => {
      return filteredAnalytics.filterRequests(additionalFilter);
    },
    [filteredAnalytics]
  );

  const getTopDomains = useCallback(
    (limit: number = 10) => {
      return filteredAnalytics.getTopDomains(limit);
    },
    [filteredAnalytics]
  );

  const getErrorAnalysis = useCallback(() => {
    return filteredAnalytics.getErrorAnalysis();
  }, [filteredAnalytics]);

  const getPerformanceInsights = useCallback(() => {
    return filteredAnalytics.getPerformanceInsights();
  }, [filteredAnalytics]);

  const refresh = useCallback(() => {
    networkAnalytics.updateRequests(requests);
  }, [requests]);

  return {
    stats,
    filterRequests: filterRequestsCallback,
    getTopDomains,
    getErrorAnalysis,
    getPerformanceInsights,
    refresh,
    filteredRequests,
    filteredCount: filteredRequests.length,
  };
};

/**
 * Hook for real-time analytics with automatic refresh intervals
 */
export const useRealTimeNetworkAnalytics = (
  refreshInterval: number = 5000
): UseNetworkAnalyticsResult & {
  lastUpdated: number;
  isStale: boolean;
} => {
  const baseAnalytics = useNetworkAnalytics();
  const lastUpdatedRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      baseAnalytics.refresh();
      lastUpdatedRef.current = Date.now();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, baseAnalytics]);

  const isStale = useMemo(() => {
    return Date.now() - lastUpdatedRef.current > refreshInterval * 1.5;
  }, [refreshInterval]);

  return {
    ...baseAnalytics,
    lastUpdated: lastUpdatedRef.current,
    isStale,
  };
};

/**
 * Hook for performance-focused analytics with debounced updates
 */
export const useDebouncedNetworkAnalytics = (
  debounceMs: number = 1000
): UseNetworkAnalyticsResult => {
  const { requests } = useNetworkMonitor();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedRequests, setDebouncedRequests] = useState<NetworkRequest[]>(
    []
  );

  // Debounce requests updates
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedRequests(requests);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [requests, debounceMs]);

  // Use debounced requests for analytics
  const stats = useMemo(() => {
    networkAnalytics.updateRequests(debouncedRequests);
    return networkAnalytics.getStats();
  }, [debouncedRequests]);

  const filterRequests = useCallback(
    (filter: NetworkFilter) => {
      networkAnalytics.updateRequests(debouncedRequests);
      return networkAnalytics.filterRequests(filter);
    },
    [debouncedRequests]
  );

  const getTopDomains = useCallback((limit: number = 10) => {
    return networkAnalytics.getTopDomains(limit);
  }, []);

  const getErrorAnalysis = useCallback(() => {
    return networkAnalytics.getErrorAnalysis();
  }, []);

  const getPerformanceInsights = useCallback(() => {
    return networkAnalytics.getPerformanceInsights();
  }, []);

  const refresh = useCallback(() => {
    networkAnalytics.updateRequests(debouncedRequests);
  }, [debouncedRequests]);

  return {
    stats,
    filterRequests,
    getTopDomains,
    getErrorAnalysis,
    getPerformanceInsights,
    refresh,
  };
};
