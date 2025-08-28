import { apiClient } from './apiClient';
import { Interaction } from '../types';

export async function createInteraction(
    params: { clientId: string; userId: string; type: string; observation?: string; explicitNext?: string | null; }
): Promise<any> {
    // userId is now inferred by the backend from the token, so we don't need to send it.
    const { userId, ...payload } = params;
    return apiClient.post('/interactions', payload);
}

export async function listInteractionsByClient(clientId: string): Promise<Interaction[]> {
  // Esta função não é mais necessária, pois o endpoint `GET /clients/:clientId`
  // já retorna as interações. Ela é mantida aqui para referência, caso seja
  // necessário um endpoint que busque apenas as interações no futuro.
  console.warn("listInteractionsByClient is deprecated. Interactions are fetched with the client.");
  const client = await apiClient.get<{ interactions: Interaction[] }>(`/clients/${clientId}`);
  return client.interactions || [];
}
