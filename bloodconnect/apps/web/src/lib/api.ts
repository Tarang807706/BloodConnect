import { ApiResponse } from '@bloodconnect/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('bc_access_token');
      this.refreshToken = localStorage.getItem('bc_refresh_token');
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bc_access_token', accessToken);
      localStorage.setItem('bc_refresh_token', refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bc_access_token');
      localStorage.removeItem('bc_refresh_token');
      localStorage.removeItem('bc_user');
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  private onTokenRefreshed(newToken: string) {
    this.refreshSubscribers.forEach(cb => cb(newToken));
    this.refreshSubscribers = [];
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/api/v1${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      // Handle 401: Token expired -> perform rotation
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (refreshRes.ok) {
              const refreshData: ApiResponse = await refreshRes.json();
              const newTokens = refreshData.data;
              this.setTokens(newTokens.accessToken, newTokens.refreshToken);
              this.onTokenRefreshed(newTokens.accessToken);
              this.isRefreshing = false;

              // Retry original request with new token
              headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
              const retryResponse = await fetch(url, { ...options, headers });
              const retryData: ApiResponse<T> = await retryResponse.json();
              if (!retryData.success) {
                throw new Error(retryData.error?.message || 'Request failed');
              }
              return retryData.data as T;
            } else {
              this.clearTokens();
              this.isRefreshing = false;
              if (typeof window !== 'undefined') {
                window.location.href = '/login?expired=1';
              }
            }
          } catch (err) {
            this.clearTokens();
            this.isRefreshing = false;
            throw err;
          }
        } else {
          // Wait for token refresh to finish then retry
          return new Promise<T>((resolve, reject) => {
            this.refreshSubscribers.push(async (newToken: string) => {
              try {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(url, { ...options, headers });
                const retryData: ApiResponse<T> = await retryResponse.json();
                if (!retryData.success) {
                  reject(new Error(retryData.error?.message || 'Request failed'));
                } else {
                  resolve(retryData.data as T);
                }
              } catch (e) {
                reject(e);
              }
            });
          });
        }
      }

      const json: ApiResponse<T> = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'An error occurred during API request');
      }

      return json.data as T;
    } catch (err: any) {
      throw err;
    }
  }

  get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  post<T = any>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  put<T = any>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  patch<T = any>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

export const api = new ApiClient();
