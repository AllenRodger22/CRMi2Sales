// services/clients.ts
import { supabase } from './supabaseClient';
import { Client, Role } from '../types';
import { convertObjectKeys, snakeToCamel, camelToSnake, parseCurrency } from '../utils/helpers';

/**
 * Fetches a list of clients with optional filtering and searching.
 * RLS policies on the Supabase backend handle user-role-based access.
 */
export async function getAllClients(params: { q?: string; status?: string; }): Promise<Client[]> {
  let query = supabase.from('clients')
    .select(`*, interactions(*)`)
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,phone.ilike.%${params.q}%,source.ilike.%${params.q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return convertObjectKeys(data, snakeToCamel);
}

/**
 * Fetches a single client by its ID.
 */
export const getClient = async (clientId: string): Promise<Client> => {
    const { data, error } = await supabase
        .from('clients')
        .select('*, interactions(*)')
        .eq('id', clientId)
        .order('created_at', { foreignTable: 'interactions', ascending: false })
        .single();
    if (error) throw error;
    return convertObjectKeys(data, snakeToCamel);
};


/**
 * Creates a new client record.
 */
export async function createClient(
    payload: Partial<Omit<Client, 'id' | 'interactions'>>,
    currentUserId: string
): Promise<Client> {
    const property_value = parseCurrency(payload.propertyValue);

    const clientData = {
        name: payload.name,
        phone: payload.phone,
        email: payload.email || null,
        source: payload.source,
        status: payload.status || 'Primeiro Atendimento',
        owner_id: currentUserId,
        observations: payload.observations || null,
        product: payload.product || null,
        property_value,
    };

    const { data, error } = await supabase.from('clients').insert([clientData]).select().single();
    if (error) throw error;
    return convertObjectKeys(data, snakeToCamel);
}

/**
 * Updates an existing client.
 */
export async function updateClient(clientId: string, fields: Partial<Client>): Promise<Client> {
    const snakeCaseFields = convertObjectKeys(fields, camelToSnake);
    if ('property_value' in snakeCaseFields) {
        snakeCaseFields.property_value = parseCurrency(String(snakeCaseFields.property_value));
    }

    const { data, error } = await supabase
        .from('clients')
        .update(snakeCaseFields)
        .eq('id', clientId)
        .select()
        .single();

    if (error) throw error;
    return convertObjectKeys(data, snakeToCamel);
}

/**
 * Deletes a client. RLS policies ensure only ADMINs can perform this.
 */
export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) throw error;
}

// ====== IMPORT / EXPORT ======

const parseCsvFile = (file: File): Promise<Record<string, string>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim());
                if (lines.length < 2) resolve([]);
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const rows = lines.slice(1).map(line => {
                    // Regex to handle comma-in-quotes
                    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/"/g, '')) || [];
                    return headers.reduce((obj, header, i) => ({ ...obj, [header]: values[i] }), {});
                });
                resolve(rows);
            } catch (e) { reject(e); }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
};

export const importClients = async (file: File, mapping: Record<string, string>, currentUserId: string) => {
    const parsedData = await parseCsvFile(file);
    const reverseMapping: Record<string, string> = Object.entries(mapping).reduce((acc, [key, val]) => ({...acc, [val]: key }), {});

    const clientsToInsert = parsedData.map(row => ({
        name: row[reverseMapping.name],
        phone: row[reverseMapping.phone],
        source: row[reverseMapping.source],
        email: row[reverseMapping.email] || null,
        observations: row[reverseMapping.observations] || null,
        product: row[reverseMapping.product] || null,
        property_value: parseCurrency(row[reverseMapping.propertyValue]),
        status: 'Primeiro Atendimento',
        owner_id: currentUserId,
    })).filter(c => c.name && c.phone && c.source);

    if (clientsToInsert.length === 0) {
        return { imported: 0, skipped: parsedData.length };
    }

    // Supabase JS client handles batching internally
    const { error } = await supabase.from('clients').insert(clientsToInsert);
    if (error) throw error;

    return { imported: clientsToInsert.length, skipped: parsedData.length - clientsToInsert.length };
};

export const exportClients = async (): Promise<Blob> => {
    // RLS will automatically filter this query based on the user's role
    const { data, error } = await supabase
        .from('clients')
        .select('name, phone, email, source, status, observations, product, property_value');

    if (error) throw error;
    if (!data || data.length === 0) {
        return new Blob([""], { type: 'text/csv;charset=utf-8;' });
    }

    const headers = ['name', 'phone', 'email', 'source', 'status', 'observations', 'product', 'property_value'];
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                let val = (row as any)[header];
                if (val === null || val === undefined) val = '';
                const strVal = String(val);
                // Escape quotes and wrap in quotes if necessary
                if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                    return `"${strVal.replace(/"/g, '""')}"`;
                }
                return strVal;
            }).join(',')
        )
    ];

    // Add BOM for Excel compatibility with UTF-8
    const csvString = '\uFEFF' + csvRows.join('\n');
    return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
};
