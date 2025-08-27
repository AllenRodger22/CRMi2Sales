// services/interactions.ts
import { supabase } from './supabaseClient';
import { Interaction } from '../types';
import { snakeToCamel, convertObjectKeys } from '../utils/helpers';

/**
 * Creates an interaction and handles status changes atomically via an RPC call.
 */
export async function createInteraction(
    params: { clientId: string; userId: string; type: string; observation?: string; explicitNext?: string | null; }
): Promise<any> {
    const { data, error } = await supabase.rpc('rpc_create_interaction', {
        p_client: params.clientId,
        p_user: params.userId,
        p_type: params.type,
        p_observation: params.observation ?? '',
        p_explicit_next: params.explicitNext ?? null
    });
    if (error) throw error;
    return data;
}

/**
 * Lists all interactions for a given client, ordered by most recent.
 */
export async function listInteractionsByClient(clientId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return convertObjectKeys(data, snakeToCamel);
}
