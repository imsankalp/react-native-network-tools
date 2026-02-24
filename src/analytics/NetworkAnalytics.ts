import type { NetworkRequest } from '../context/types';

export interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  pendingRequests: number;
  averageResponseTime: number;
  slowestRequest: NetworkRequest | null;
  fastestRequest: NetworkRequest | null;
  mostFrequentDomain: string | null;
  errorRate: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<number, number>;
  requestsByDomain: Record<string, number>;
  timeRangeStats: {
    last5Minutes: number;
    last15Minutes: number;
    lastHour: number;
  };
}

export interface NetworkFilter {
  method?: string[];
  status?: number[];
  domain?: string[];
  timeRange?: {
    start: number;
    end: number;
  };
  searchTerm?: string;
  hasError?: boolean;
  minDuration?: number;
  maxDuration?: number;
}

export class NetworkAnalytics {
  private requests: NetworkRequest[] = [];

  updateRequests(requests: NetworkRequest[]): void {
    this.requests = requests;
  }

  getStats(): NetworkStats {
    const now = Date.now();
    const completedRequests = this.requests.filter((req) => req.duration > 0);
    const successfulRequests = this.requests.filter(
      (req) => req.responseCode >= 200 && req.responseCode < 400
    );
    const failedRequests = this.requests.filter(
      (req) => req.responseCode >= 400 || req.error
    );
    const pendingRequests = this.requests.filter(
      (req) => !req.responseCode || req.responseCode === 0
    );

    // Calculate average response time
    const totalDuration = completedRequests.reduce(
      (sum, req) => sum + req.duration,
      0
    );
    const averageResponseTime =
      completedRequests.length > 0
        ? totalDuration / completedRequests.length
        : 0;

    // Find slowest and fastest requests
    const sortedByDuration = [...completedRequests].sort(
      (a, b) => b.duration - a.duration
    );
    const slowestRequest = sortedByDuration[0] || null;
    const fastestRequest =
      sortedByDuration[sortedByDuration.length - 1] || null;

    // Group by method
    const requestsByMethod = this.requests.reduce(
      (acc, req) => {
        acc[req.method] = (acc[req.method] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group by status
    const requestsByStatus = this.requests.reduce(
      (acc, req) => {
        if (req.responseCode) {
          acc[req.responseCode] = (acc[req.responseCode] || 0) + 1;
        }
        return acc;
      },
      {} as Record<number, number>
    );

    // Group by domain
    const requestsByDomain = this.requests.reduce(
      (acc, req) => {
        try {
          const domain = new URL(req.url).hostname;
          acc[domain] = (acc[domain] || 0) + 1;
        } catch {
          acc['invalid-url'] = (acc['invalid-url'] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Find most frequent domain
    const mostFrequentDomain =
      Object.entries(requestsByDomain).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      null;

    // Calculate error rate
    const errorRate =
      this.requests.length > 0
        ? (failedRequests.length / this.requests.length) * 100
        : 0;

    // Time range stats
    const last5Minutes = this.requests.filter(
      (req) => now - req.duration <= 5 * 60 * 1000
    ).length;
    const last15Minutes = this.requests.filter(
      (req) => now - req.duration <= 15 * 60 * 1000
    ).length;
    const lastHour = this.requests.filter(
      (req) => now - req.duration <= 60 * 60 * 1000
    ).length;

    return {
      totalRequests: this.requests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      pendingRequests: pendingRequests.length,
      averageResponseTime,
      slowestRequest,
      fastestRequest,
      mostFrequentDomain,
      errorRate,
      requestsByMethod,
      requestsByStatus,
      requestsByDomain,
      timeRangeStats: {
        last5Minutes,
        last15Minutes,
        lastHour,
      },
    };
  }

  filterRequests(filter: NetworkFilter): NetworkRequest[] {
    return this.requests.filter((request) => {
      // Method filter
      if (filter.method && filter.method.length > 0) {
        if (!filter.method.includes(request.method)) {
          return false;
        }
      }

      // Status filter
      if (filter.status && filter.status.length > 0) {
        if (
          !request.responseCode ||
          !filter.status.includes(request.responseCode)
        ) {
          return false;
        }
      }

      // Domain filter
      if (filter.domain && filter.domain.length > 0) {
        try {
          const domain = new URL(request.url).hostname;
          if (!filter.domain.includes(domain)) {
            return false;
          }
        } catch {
          return false;
        }
      }

      // Time range filter
      if (filter.timeRange) {
        if (
          request.duration < filter.timeRange.start ||
          request.duration > filter.timeRange.end
        ) {
          return false;
        }
      }

      // Search term filter
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesUrl = request.url.toLowerCase().includes(searchLower);
        const matchesMethod = request.method
          .toLowerCase()
          .includes(searchLower);
        const matchesStatus = request.responseCode
          ?.toString()
          .includes(searchLower);

        if (!matchesUrl && !matchesMethod && !matchesStatus) {
          return false;
        }
      }

      // Error filter
      if (filter.hasError !== undefined) {
        const hasError = request.responseCode >= 400 || !!request.error;
        if (filter.hasError !== hasError) {
          return false;
        }
      }

      // Duration filters
      if (
        filter.minDuration !== undefined &&
        request.duration < filter.minDuration
      ) {
        return false;
      }

      if (
        filter.maxDuration !== undefined &&
        request.duration > filter.maxDuration
      ) {
        return false;
      }

      return true;
    });
  }

  getTopDomains(
    limit: number = 10
  ): Array<{ domain: string; count: number; percentage: number }> {
    const stats = this.getStats();
    const total = stats.totalRequests;

    return Object.entries(stats.requestsByDomain)
      .map(([domain, count]) => ({
        domain,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getErrorAnalysis(): {
    errorsByStatus: Record<number, number>;
    errorsByDomain: Record<string, number>;
    commonErrors: Array<{ error: string; count: number }>;
  } {
    const errorRequests = this.requests.filter(
      (req) => req.responseCode >= 400 || req.error
    );

    const errorsByStatus = errorRequests.reduce(
      (acc, req) => {
        if (req.responseCode >= 400) {
          acc[req.responseCode] = (acc[req.responseCode] || 0) + 1;
        }
        return acc;
      },
      {} as Record<number, number>
    );

    const errorsByDomain = errorRequests.reduce(
      (acc, req) => {
        try {
          const domain = new URL(req.url).hostname;
          acc[domain] = (acc[domain] || 0) + 1;
        } catch {
          acc['invalid-url'] = (acc['invalid-url'] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const errorMessages = errorRequests
      .filter((req) => req.error)
      .reduce(
        (acc, req) => {
          const error = req.error!;
          acc[error] = (acc[error] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    const commonErrors = Object.entries(errorMessages)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count);

    return {
      errorsByStatus,
      errorsByDomain,
      commonErrors,
    };
  }

  getPerformanceInsights(): {
    slowRequests: NetworkRequest[];
    fastRequests: NetworkRequest[];
    averageByDomain: Record<string, number>;
    performanceScore: number;
  } {
    const completedRequests = this.requests.filter((req) => req.duration > 0);
    const sortedByDuration = [...completedRequests].sort(
      (a, b) => b.duration - a.duration
    );

    const slowRequests = sortedByDuration.slice(0, 10);
    const fastRequests = sortedByDuration.slice(-10).reverse();

    // Average response time by domain
    const domainStats = completedRequests.reduce(
      (acc, req) => {
        try {
          const domain = new URL(req.url).hostname;
          if (!acc[domain]) {
            acc[domain] = { total: 0, count: 0 };
          }
          acc[domain].total += req.duration;
          acc[domain].count += 1;
        } catch {
          // Skip invalid URLs
        }
        return acc;
      },
      {} as Record<string, { total: number; count: number }>
    );

    const averageByDomain = Object.entries(domainStats).reduce(
      (acc, [domain, stats]) => {
        acc[domain] = stats.total / stats.count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate performance score (0-100)
    const stats = this.getStats();
    const avgResponseTime = stats.averageResponseTime;
    const errorRate = stats.errorRate;

    let performanceScore = 100;

    // Penalize for slow response times
    if (avgResponseTime > 1000) {
      performanceScore -= Math.min(50, (avgResponseTime - 1000) / 100);
    }

    // Penalize for high error rates
    performanceScore -= errorRate;

    performanceScore = Math.max(0, Math.round(performanceScore));

    return {
      slowRequests,
      fastRequests,
      averageByDomain,
      performanceScore,
    };
  }
}

// Export singleton instance
export const networkAnalytics = new NetworkAnalytics();
