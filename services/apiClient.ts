const BASE_URL = 'https://i2sales-be-test.onrender.com/api/v1';

const getToken = () => localStorage.getItem('authToken');

export class ApiError extends Error {
  constructor(message: string, public status: number, public data: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: 'Ocorreu um erro inesperado na comunicação com o servidor.' };
    }
    throw new ApiError(errorData.error || response.statusText, response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  if (contentType && (contentType.includes('text/csv') || contentType.includes('application/pdf') || contentType.includes('blob'))) {
    return response.blob() as Promise<T>;
  }

  return response.text() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, { ...options, method: 'POST', body: isFormData ? body : JSON.stringify(body) });
  },
  put: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
