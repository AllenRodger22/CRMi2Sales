import { User, ProductivityData, FunnelAnalyticsData, Role } from '../types';

// This file has been repurposed as the main API service.
const API_BASE_URL = 'http://localhost:3000'; 

// Default "empty" states to prevent TypeError on empty API responses
const emptyProductivityData: ProductivityData = {
    kpis: { ligacoes: 0, ce: 0, tratativas: 0, documentacao: 0, vendas: 0 },
    timeseries: { daily: [] },
    breakdown: { porOrigem: [], porBroker: [] },
    brokers: [],
};

const emptyFunnelAnalyticsData: FunnelAnalyticsData = {
    funnel: [],
    conversionRates: {}
};


const getAuthToken = (): string | null => {
    try {
        return localStorage.getItem('authToken');
    } catch (e) {
        console.error('Could not get auth token from local storage', e);
        return null;
    }
};

const getAuthUser = (): User | null => {
    try {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) as User : null;
    } catch (e) {
        console.error('Could not get user from local storage', e);
        return null;
    }
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = new Headers(options.headers || {});
    
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }
    
    if (!(options.body instanceof FormData)) {
        headers.append('Content-Type', 'application/json');
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            cache: 'no-store', // Prevent browser from serving stale data
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'An API error occurred');
        }

        if (response.status === 204) { // No Content
            return null;
        }
        
        if (response.headers.get('Content-Type')?.includes('text/csv')) {
            return response.blob();
        }
        
        // Safely parse JSON, handles empty body
        const responseText = await response.text();
        try {
            return responseText ? JSON.parse(responseText) : null;
        } catch (e) {
            console.error("Failed to parse JSON response:", responseText);
            throw new Error('Invalid JSON response from server.');
        }
    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error(
                'Network error: "Failed to fetch". This is likely a CORS issue or the backend server is down. ' +
                'Please ensure the server at "http://localhost:3000" is running and configured to accept requests from this origin.'
            );
            throw new Error(
                'Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3000 e se o CORS está habilitado.'
            );
        }
        // Re-throw other unexpected errors
        throw error;
    }
};


// --- Auth ---
export const login = (email: string, password: string): Promise<{ token: string, user: User }> => 
    apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

export const register = (name: string, email: string, password: string, role: Role): Promise<User> =>
    apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
    });


// --- Clients ---
export const getClients = async (params: { searchQuery?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.searchQuery) {
        query.append('q', params.searchQuery);
    }
    if (params.status) {
        query.append('status', params.status);
    }
    const endpoint = `/clients?${query.toString()}`;
    const data = await apiFetch(endpoint);
    return data || []; // Ensure an array is always returned
};
export const getClient = (clientId: string) => apiFetch(`/clients/${clientId}`);
export const createClient = (clientData: any) => apiFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
});
export const updateClient = (clientId: string, clientData: any) => apiFetch(`/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
});
export const deleteClientApi = (clientId: string) => apiFetch(`/clients/${clientId}`, {
    method: 'DELETE',
});

// --- Interactions ---
export const createInteraction = (clientId: string, interactionData: any) => {
    const user = getAuthUser();
    if (!user) {
        console.error("Attempted to create interaction without an authenticated user.");
        return Promise.reject(new Error("User not found. Cannot create interaction."));
    }

    const payload = {
        ...interactionData,
        user_id: user.id,
    };
    
    return apiFetch(`/clients/${clientId}/interactions`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

// --- Import/Export ---
export const importClients = (formData: FormData) => apiFetch('/clients/import', {
    method: 'POST',
    body: formData,
});
export const exportClients = (): Promise<Blob> => apiFetch('/clients/export');

// --- Analytics ---
export const getBrokerKpis = async () => {
    const data = await apiFetch('/analytics/kpis/broker');
    return data || {}; // Return empty object if no KPIs to prevent type errors
};

export const getProductivityData = async (params: { startDate: string, endDate: string, brokerId?: string }): Promise<ProductivityData> => {
    const query = new URLSearchParams(params as any).toString();
    const data = await apiFetch(`/analytics/productivity?${query}`);
    if (!data) {
        return emptyProductivityData;
    }
    // Ensure all nested properties exist to prevent TypeErrors in components
    return {
        kpis: data.kpis || emptyProductivityData.kpis,
        managerKpis: data.managerKpis, // Pass along manager kpis if they exist
        timeseries: data.timeseries || emptyProductivityData.timeseries,
        breakdown: data.breakdown || emptyProductivityData.breakdown,
        brokers: data.brokers || [],
    };
}
export const getFunnelAnalyticsData = async (params: { startDate: string, endDate: string, brokerId?: string }): Promise<FunnelAnalyticsData> => {
    const query = new URLSearchParams(params as any).toString();
    const data = await apiFetch(`/analytics/funnel?${query}`);
    if (!data) {
        return emptyFunnelAnalyticsData;
    }
    // Ensure all nested properties exist to prevent TypeErrors in components
    return {
        funnel: data.funnel || emptyFunnelAnalyticsData.funnel,
        conversionRates: data.conversionRates || emptyFunnelAnalyticsData.conversionRates,
    };
}

// --- Activities ---
export const getActivities = async () => {
    // Assuming an /activities endpoint, as per standard REST practices.
    const data = await apiFetch('/activities');
    return data || []; // Ensure an array is always returned
};