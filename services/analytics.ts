// services/analytics.ts
import { supabase } from './supabaseClient';
import { ProductivityData, FunnelAnalyticsData, Role, ManagerKpis } from '../types';
import { convertObjectKeys, snakeToCamel } from '../utils/helpers';

/**
 * Fetches the 4 main KPIs for the broker dashboard using efficient count queries.
 */
export async function getBrokerKpis(currentUserId: string): Promise<{
    leadsEmTratativa: number;
    leadsPrimeiroAtendimento: number;
    totalLeads: number;
    followUpAtrasado: number;
}> {
    const queries = [
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('owner_id', currentUserId).eq('follow_up_state', 'Ativo'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('owner_id', currentUserId).eq('status', 'Primeiro Atendimento'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('owner_id', currentUserId).neq('status', 'Arquivado'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('owner_id', currentUserId).eq('follow_up_state', 'Atrasado')
    ];

    const [r1, r2, r3, r4] = await Promise.all(queries);

    if (r1.error || r2.error || r3.error || r4.error) {
        console.error(r1.error || r2.error || r3.error || r4.error);
        throw new Error('Failed to fetch broker KPIs');
    }

    return {
        leadsEmTratativa: r1.count ?? 0,
        leadsPrimeiroAtendimento: r2.count ?? 0,
        totalLeads: r3.count ?? 0,
        followUpAtrasado: r4.count ?? 0,
    };
}


/**
 * Fetches VGV and Opportunity value for managers/admins.
 */
async function getManagerKpis(
    { startDate, endOfDay, target }: { startDate: string; endOfDay: string; target: string | null }
): Promise<Pick<ManagerKpis, 'vgv' | 'oportunidade'>> {
    // VGV RPC call
    const { data: vgvData, error: vgvError } = await supabase.rpc('rpc_manager_vgv', {
        p_start: startDate,
        p_end: endOfDay,
        p_owner: target
    });
    if (vgvError) throw vgvError;

    // Opportunity query
    let oppQuery = supabase.from('clients')
        .select('property_value')
        .not('status', 'in', '("Venda Gerada","Arquivado")');
    if (target) {
        oppQuery = oppQuery.eq('owner_id', target);
    }
    const { data: oppData, error: oppError } = await oppQuery;
    if (oppError) throw oppError;

    const oportunidade = (oppData ?? []).reduce((sum, row) => sum + (Number(row.property_value) || 0), 0);
    const vgv = vgvData && vgvData.length > 0 ? Number(vgvData[0].value) : 0;
    
    return { vgv, oportunidade };
}


/**
 * Fetches all productivity data (KPIs, timeseries, breakdowns) by calling RPCs.
 */
export async function getProductivityData(params: {
    startDate: string;
    endDate: string;
    role: Role;
    brokerId?: string;
    currentUserId: string;
}): Promise<ProductivityData> {
    const endOfDay = `${params.endDate}T23:59:59.999Z`;
    const targetUser = (params.role === 'BROKER') ? params.currentUserId : (params.brokerId || null);

    const rpcParams = {
        p_start: params.startDate,
        p_end: endOfDay,
        p_user: targetUser
    };

    const [
        kpisRes,
        timeseriesRes,
        brokerBreakdownRes,
        originBreakdownRes,
        brokersRes
    ] = await Promise.all([
        supabase.rpc('rpc_productivity_kpis', rpcParams),
        supabase.rpc('rpc_productivity_timeseries', rpcParams),
        supabase.rpc('rpc_breakdown_broker', rpcParams),
        supabase.rpc('rpc_breakdown_origem', rpcParams),
        supabase.from('profiles').select('id, name').eq('role', 'BROKER').order('name')
    ]);

    const errors = [kpisRes.error, timeseriesRes.error, brokerBreakdownRes.error, originBreakdownRes.error, brokersRes.error].filter(Boolean);
    if (errors.length > 0) {
        console.error("Error fetching productivity data:", errors);
        throw errors[0];
    }

    const productivityKpis = kpisRes.data?.[0] ?? { ligacoes: 0, ce: 0, tratativas: 0, documentacao: 0, vendas: 0 };
    
    let managerKpisData: ManagerKpis | undefined = undefined;
    if (params.role !== 'BROKER') {
        const { vgv, oportunidade } = await getManagerKpis({ startDate: params.startDate, endOfDay, target: targetUser });
        managerKpisData = {
            vgv,
            oportunidade,
            ligacoes: productivityKpis.ligacoes,
            vendas: productivityKpis.vendas,
        };
    }
    
    return {
        kpis: productivityKpis,
        managerKpis: managerKpisData,
        timeseries: { daily: convertObjectKeys(timeseriesRes.data ?? [], snakeToCamel) },
        breakdown: {
            porOrigem: convertObjectKeys(originBreakdownRes.data ?? [], snakeToCamel),
            porBroker: convertObjectKeys(brokerBreakdownRes.data ?? [], snakeToCamel)
        },
        brokers: brokersRes.data ?? []
    };
}


/**
 * Fetches funnel analytics data via an RPC call.
 */
export async function getFunnelAnalyticsData(params: {
    startDate: string;
    endDate: string;
    role: Role;
    brokerId?: string;
    currentUserId: string;
}): Promise<FunnelAnalyticsData> {
    const endOfDay = `${params.endDate}T23:59:59.999Z`;
    const targetUser = (params.role === 'BROKER') ? params.currentUserId : (params.brokerId || null);

    const { data, error } = await supabase.rpc('rpc_funnel', {
        p_start: params.startDate,
        p_end: endOfDay,
        p_user: targetUser
    });

    if (error) {
        console.error('Error fetching funnel analytics data:', error);
        throw error;
    }

    return {
        funnel: (data || []).map(r => ({ ...r, count: Number(r.count || 0) })),
        conversionRates: {} // Calculation is handled on the client-side
    };
}
