import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string = 'https://jsonplaceholder.typicode.com';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Helper to add artificial delay
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig & { delay?: number }
  ): Promise<AxiosResponse<T>> {
    if (config?.delay) {
      await this.delay(config.delay);
    }
    return this.client.get<T>(url, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { delay?: number }
  ): Promise<AxiosResponse<T>> {
    if (config?.delay) {
      await this.delay(config.delay);
    }
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { delay?: number }
  ): Promise<AxiosResponse<T>> {
    if (config?.delay) {
      await this.delay(config.delay);
    }
    return this.client.put<T>(url, data, config);
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & { delay?: number }
  ): Promise<AxiosResponse<T>> {
    if (config?.delay) {
      await this.delay(config.delay);
    }
    return this.client.delete<T>(url, config);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { delay?: number }
  ): Promise<AxiosResponse<T>> {
    if (config?.delay) {
      await this.delay(config.delay);
    }
    return this.client.patch<T>(url, data, config);
  }
}

export const apiClient = new ApiClient();
