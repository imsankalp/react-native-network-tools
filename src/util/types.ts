export type AppError = {
  id: string;
  error: Error | unknown;
  context?: Record<string, any>;
  timestamp: number;
};

export type ReportErrorPropType = {
  error: Error | unknown;
  context?: Record<string, any>;
};

export type Listener = (errors: AppError[]) => void;

export interface UrlDetails {
  baseUrl: string;
  endpoint: string;
  queryParams: Record<string, string>;
  pathParams: Record<string, string>;
  isQueryParamsPresent: boolean;
}
