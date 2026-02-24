import { type ReactNode } from 'react';

export type NetworkRequestCustomErrorType = 'http' | 'validation' | 'custom';

export type NetworkRequestCustomError = {
  message: string;
  code?: string;
  type: NetworkRequestCustomErrorType;
  details?: unknown;
  source: 'react-native';
  timestamp: number;
};

export type AnnotateNetworkRequestErrorInput = {
  requestId?: string;
  url?: string;
  method?: string;
  message: string;
  code?: string;
  type?: NetworkRequestCustomErrorType;
  details?: unknown;
};

export type NetworkRequest = {
  id: string;
  url: string;
  method: string;
  responseCode: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestData?: any;
  responseData?: any;
  duration: number;
  requestTime: number;
  responseTime: number;
  error?: string;
  customError?: NetworkRequestCustomError;
};

export type NetworkMonitorContextType = {
  requests: NetworkRequest[];
  addRequest: (request: NetworkRequest) => void;
  clearRequests: () => void;
  getRequestById: (id: string) => NetworkRequest | null;
  annotateRequestError: (
    input: AnnotateNetworkRequestErrorInput
  ) => string | null;
};

export interface NetworkMonitorProviderProps {
  children: ReactNode;
  maxRequests?: number;
  showFloatingMonitor?: boolean;
}

export const sample = {
  responseCode: 200,
  responseTime: 1769976483354,
  requestBody: '',
  requestTime: 1769976482851,
  responseBody:
    '{\n  "userId": 1,\n  "id": 1,\n  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",\n  "body": "quia et suscipit\\nsuscipit recusandae consequuntur expedita et cum\\nreprehenderit molestiae ut ut quas totam\\nnostrum rerum est autem sunt rem eveniet architecto"\n}',
  method: 'GET',
  requestHeaders: {
    accept: 'application/json, text/plain, ',
  },
  duration: 503,
  responseHeaders: {
    'alt-svc': 'h3=":443"; ma=86400',
    'cf-cache-status': 'HIT',
    'x-ratelimit-remaining': '999',
    'x-ratelimit-limit': '1000',
    'cf-ray': '9c7414e1bc19fd8d-SIN',
    'x-powered-by': 'Express',
    'x-content-type-options': 'nosniff',
    'via': '2.0 heroku-router',
    'vary': 'Origin, Accept-Encoding',
    'server': 'cloudflare',
    'content-type': 'application/json; charset=utf-8',
    'expires': '-1',
    'reporting-endpoints':
      'heroku-nel="https://nel.heroku.com/reports?s=fYWdnEf0DmCzgr0VsN5e6AtGFTukaisQ17mn0sPpnh8%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1769696362"',
    'age': '20947',
    'report-to':
      '{"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=fYWdnEf0DmCzgr0VsN5e6AtGFTukaisQ17mn0sPpnh8%3D\\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\\u0026ts=1769696362"}],"max_age":3600}',
    'pragma': 'no-cache',
    'access-control-allow-credentials': 'true',
    'x-ratelimit-reset': '1769696416',
    'etag': 'W/"124-yiKdLzqO5gfBrJFrcdJ8Yq0LGnU"',
    'cache-control': 'max-age=43200',
    'date': 'Sun, 01 Feb 2026 20:08:34 GMT',
    'nel':
      '{"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}',
  },
  url: 'https://jsonplaceholder.typicode.com/posts/1',
  id: 'e94de77e-8d38-462e-a8e5-f93d06dec141',
};
