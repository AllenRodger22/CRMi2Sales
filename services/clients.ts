import { apiClient } from './apiClient';
import { Client } from '../types';
import { parseCurrency } from '../utils/helpers';

export async function getAllClients(params: { q?: string; status?: string; }): Promise<Client[]> {
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.set('q', params.q);
  if (params.status) queryParams.set('status', params.status);
  
  const endpoint = `/clients?${queryParams.toString()}`;
  return apiClient.get<Client[]>(endpoint);
}

export const getClient = (clientId: string): Promise<Client> => {
    return apiClient.get<Client>(`/clients/${clientId}`);
};

export async function createClient(
    payload: Partial<Omit<Client, 'id' | 'interactions'>>,
    _currentUserId: string // O backend agora infere o usuário pelo token
): Promise<Client> {
    const propertyValue = parseCurrency(payload.propertyValue);

    const clientData = {
        ...payload,
        propertyValue,
    };
    return apiClient.post<Client>('/clients', clientData);
}

export async function updateClient(clientId: string, fields: Partial<Client>): Promise<Client> {
    // FIX: Correctly handle type conversion for propertyValue from string to number for the API request.
    const payload = { ...fields };
    if ('propertyValue' in payload) {
        // The frontend uses a string for propertyValue, but the backend expects a number.
        // We create a new payload object with the correctly typed numeric value.
        const numericValue = parseCurrency(String(payload.propertyValue));
        const apiPayload = {
            ...payload,
            propertyValue: numericValue,
        };
        return apiClient.put<Client>(`/clients/${clientId}`, apiPayload);
    }
    // If propertyValue is not being updated, send the payload as is.
    return apiClient.put<Client>(`/clients/${clientId}`, payload);
}

export async function deleteClient(clientId: string): Promise<void> {
  return apiClient.delete<void>(`/clients/${clientId}`);
}

// ====== IMPORT / EXPORT ======

export const importClients = async (
    file: File, 
    mapping: Record<string, string>, 
    _currentUserId: string // O backend agora infere o usuário pelo token
) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    return apiClient.post<{ imported: number; skipped: number; }>('/clients/import', formData);
};

export const exportClients = async (): Promise<Blob> => {
    return apiClient.get<Blob>('/clients/export');
};