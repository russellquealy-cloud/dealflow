/**
 * Universal API Client
 * 
 * Works in both web (Next.js) and React Native environments.
 * Abstracts fetch calls to provide consistent error handling and response parsing.
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiRequestOptions extends RequestInit {
  baseUrl?: string;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl?: string, defaultTimeout = 30000) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Get the base URL for API requests
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set the base URL for API requests
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Make an API request with automatic error handling
   */
  async request<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      baseUrl = this.baseUrl,
      timeout = this.defaultTimeout,
      headers = {},
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: T | undefined;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? (text as unknown as T) : undefined;
      }

      if (!response.ok) {
        const error: ApiError = {
          message: (data as { error?: string })?.error || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };

        return {
          success: false,
          error,
          data: undefined,
        };
      }

      return {
        success: true,
        data,
        error: undefined,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            message: 'Request timeout',
            code: 'TIMEOUT',
          },
        };
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Create singleton instance
let apiClientInstance: ApiClient | null = null;

/**
 * Get or create the API client instance
 */
export function getApiClient(baseUrl?: string): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient(baseUrl);
  }
  return apiClientInstance;
}

/**
 * Create a new API client instance (useful for testing)
 */
export function createApiClient(baseUrl?: string, timeout?: number): ApiClient {
  return new ApiClient(baseUrl, timeout);
}

// Export default instance getter
export default getApiClient;

