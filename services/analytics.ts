import { apiClient } from './apiClient';
import { ProductivityData, FunnelAnalyticsData, Role } from '../types';

export async function getBrokerKpis(_currentUserId: string): Promise<{ // userId is now inferred from token
    leadsEmTratativa: number;
    leadsPrimeiroAtendimento: number;
    totalLeads: number;
    followUpAtrasado: number;
}> {
    return apiClient.get('/analytics/broker-kpis');
}

export async function getProductivityData(params: {
    startDate: string;
    endDate: string;
    role: Role;
    brokerId?: string;
    currentUserId: string;
}): Promise<ProductivityData> {
    const queryParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
    });
    if (params.brokerId) {
        queryParams.set('brokerId', params.brokerId);
    }
    // currentUserId e role não são mais necessários como parâmetros,
    // o backend os determinará a partir do token de autenticação.
    return apiClient.get(`/analytics/productivity?${queryParams.toString()}`);
}

export async function getFunnelAnalyticsData(params: {
    startDate: string;
    endDate: string;
    role: Role;
    brokerId?: string;
    currentUserId: string;
}): Promise<FunnelAnalyticsData> {
    const queryParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
    });
    if (params.brokerId) {
        queryParams.set('brokerId', params.brokerId);
    }
    return apiClient.get(`/analytics/funnel?${queryParams.toString()}`);
}
