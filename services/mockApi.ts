// api.ts — API service único, resiliente e tipado
// Troque o nome do arquivo se preferir manter "apimock.ts"

// ====== TYPES (ajuste se seus tipos já existirem em ../types) ======
// FIX: Removed local type definitions and imported them from the central types file.
import {
  Role,
  User,
  ProductivityData,
  FunnelAnalyticsData,
} from '../types';


// ====== CONFIG ======
const API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
  'https://backend-crm-i2sales.onrender.com';

const DEFAULT_TIMEOUT_MS = 20000;
const CSV_MIME = 'text/csv';

// ====== SESSION STORAGE HELPERS ======
const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

export const getAuthToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

export const getAuthUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as User : null;
  } catch { return null; }
};

export const setSession = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isLoggedIn = () => !!getAuthToken();

// Permite a UI reagir a 401 globais (ex.: redirecionar pro login)
let unauthorizedHandler: (() => void) | null = null;
export const onUnauthorized = (cb: () => void) => { unauthorizedHandler = cb; };

// ====== CORE FETCH ======
type ApiOptions = RequestInit & {
  timeoutMs?: number;
  retry?: number;            // número de tentativas extras (ex.: 1 = tenta +1 vez)
  retryDelayMs?: number;     // atraso entre tentativas
  skipAuth?: boolean;        // para endpoints públicos (login/register)
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const buildHeaders = (opts: ApiOptions): Headers => {
  const headers = new Headers(opts.headers || {});
  const hasBody = !!opts.body && !(opts.body instanceof FormData);
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (!opts.skipAuth) {
    const token = getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

const withTimeout = async <T>(p: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    // encadeia um controller para garantir timeout, sem sobrescrever o sinal existente
    const race = await Promise.race([
      p,
      new Promise<never>((_, rej) => {
        const onAbort = () => rej(new DOMException('Aborted', 'AbortError'));
        ctrl.signal.addEventListener('abort', onAbort, { once: true });
        if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });
      }),
    ]);
    return race as T;
  } finally {
    clearTimeout(id);
  }
};

const parseResponse = async (res: Response) => {
  if (res.status === 204) return null;
  const contentType = res.headers.get('Content-Type') || '';
  const text = await res.text();
  if (!text) return null;

  if (contentType.includes(CSV_MIME)) {
    return new Blob([text], { type: CSV_MIME });
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Invalid JSON response:', text);
    throw new Error('Resposta inválida do servidor');
  }
};

const apiFetch = async <T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retry = 0, retryDelayMs = 600, skipAuth } = options;

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retry) {
    try {
      const headers = buildHeaders({ ...options, skipAuth });
      const res = await withTimeout(fetch(url, { ...options, headers, cache: 'no-store' }), timeoutMs, options.signal);
      const body = await parseResponse(res);

      if (!res.ok) {
        // tenta extrair mensagem de erro amigável
        const message = (body && (body.error || body.message)) || res.statusText || 'Erro na API';
        if (res.status === 401) {
          // sessão inválida/expirada
          if (!skipAuth) {
            clearSession();
            unauthorizedHandler?.();
          }
          throw new Error(message || 'Não autorizado');
        }
        throw new Error(message);
      }

      return body as T;
    } catch (err: any) {
      lastError = err;
      const isAbort = err?.name === 'AbortError';
      const isNetwork = err?.message && /Failed to fetch|NetworkError/i.test(err.message);

      if (attempt < retry && (isNetwork || isAbort)) {
        await sleep(retryDelayMs);
        attempt++;
        continue;
      }
      if (isNetwork) {
        throw new Error('Falha de rede/CORS ao conectar na API.');
      }
      throw err;
    }
  }

  // Se saiu do loop sem retornar
  throw lastError || new Error('Erro desconhecido na API');
};

// ====== EMPTY / DEFAULTS ======
const emptyProductivityData: ProductivityData = {
  kpis: { ligacoes: 0, ce: 0, tratativas: 0, documentacao: 0, vendas: 0 },
  timeseries: { daily: [] },
  breakdown: { porOrigem: [], porBroker: [] },
  brokers: [],
};

const emptyFunnelAnalyticsData: FunnelAnalyticsData = {
  funnel: [],
  conversionRates: {},
};

// ====== AUTH ======
export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
    retry: 0,
  });
  setSession(data.token, data.user);
  return data;
};

export const register = async (name: string, email: string, password: string, role: Role): Promise<User> => {
  const user = await apiFetch<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
    skipAuth: true,
  });
  // Se quiser auto-login, descomente:
  // const { token, user: u } = await login(email, password);
  return user;
};

export const logout = () => clearSession();

// ====== CLIENTS ======
export const getClients = async (params: { searchQuery?: string; status?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.searchQuery) qs.set('q', params.searchQuery);
  if (params.status) qs.set('status', params.status);
  const data = await apiFetch<any[]>(`/clients?${qs.toString()}`, { retry: 1 });
  return Array.isArray(data) ? data : [];
};

export const getClient = (clientId: string) =>
  apiFetch(`/clients/${clientId}`, { retry: 1 });

export const createClient = (clientData: any) =>
  apiFetch('/clients', { method: 'POST', body: JSON.stringify(clientData) });

export const updateClient = (clientId: string, clientData: any) =>
  apiFetch(`/clients/${clientId}`, { method: 'PUT', body: JSON.stringify(clientData) });

export const deleteClientApi = (clientId: string) =>
  apiFetch(`/clients/${clientId}`, { method: 'DELETE' });

// ====== INTERACTIONS ======
export const createInteraction = (clientId: string, interactionData: any) => {
  const user = getAuthUser();
  if (!user) return Promise.reject(new Error('Usuário não autenticado.'));
  const payload = { ...interactionData, user_id: user.id };
  return apiFetch(`/clients/${clientId}/interactions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// ====== IMPORT / EXPORT ======
export const importClients = (file: File, mapping: Record<string, string>) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mapping));
  return apiFetch('/clients/import', { method: 'POST', body: formData });
};

export const exportClients = (): Promise<Blob> =>
  apiFetch('/clients/export', { retry: 1 });

// ====== ANALYTICS ======
export const getBrokerKpis = async () => {
  const data = await apiFetch('/analytics/kpis/broker', { retry: 1 });
  return data || {};
};

export const getProductivityData = async (params: { startDate: string; endDate: string; brokerId?: string }): Promise<ProductivityData> => {
  const qs = new URLSearchParams(params as any).toString();
  const data = await apiFetch<ProductivityData | null>(`/analytics/productivity?${qs}`, { retry: 1 });
  return data
    ? {
        kpis: data.kpis || emptyProductivityData.kpis,
        managerKpis: data.managerKpis,
        timeseries: data.timeseries || emptyProductivityData.timeseries,
        breakdown: data.breakdown || emptyProductivityData.breakdown,
        brokers: data.brokers || [],
      }
    : emptyProductivityData;
};

export const getFunnelAnalyticsData = async (params: { startDate: string; endDate: string; brokerId?: string }): Promise<FunnelAnalyticsData> => {
  const qs = new URLSearchParams(params as any).toString();
  const data = await apiFetch<FunnelAnalyticsData | null>(`/analytics/funnel?${qs}`, { retry: 1 });
  return data
    ? {
        funnel: data.funnel || emptyFunnelAnalyticsData.funnel,
        conversionRates: data.conversionRates || emptyFunnelAnalyticsData.conversionRates,
      }
    : emptyFunnelAnalyticsData;
};

// ====== ACTIVITIES ======
export const getActivities = async () => {
  const data = await apiFetch<any[]>('/activities', { retry: 1 });
  return Array.isArray(data) ? data : [];
};

// ====== QUALITY OF LIFE ======
// Helper para baixar CSV sem mexer no componente
export const downloadCsv = async (endpoint: string, filename = 'export.csv') => {
  const blob = await apiFetch<Blob>(endpoint, { retry: 1 });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};
