import React, { useState, useEffect } from 'react';
import Funnel from '../components/Funnel';
import LineChart from '../components/LineChart';
import BreakdownTable from '../components/BreakdownTable';
import FiltersBar from '../components/FiltersBar';
import Tabs from '../components/Tabs';
import { ProductivityData, FunnelAnalyticsData } from '../types';
import * as api from '../services/mockApi';
import DateRangePickerModal from '../components/DateRangePickerModal';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const getInitialDateRange = () => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

const formatDateRange = (range: { start: Date; end: Date }) => {
    const startStr = range.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const endStr = range.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${startStr} - ${endStr}`;
};

const formatDateForApi = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

const ManagerDashboard: React.FC = () => {
    const [productivityData, setProductivityData] = useState<ProductivityData | null>(null);
    const [funnelAnalyticsData, setFunnelAnalyticsData] = useState<FunnelAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(getInitialDateRange());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedBrokerId, setSelectedBrokerId] = useState(''); // Empty string for 'All Brokers'

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const apiParams: { startDate: string; endDate: string; brokerId?: string } = {
                    startDate: formatDateForApi(dateRange.start),
                    endDate: formatDateForApi(dateRange.end),
                };
                if (selectedBrokerId) {
                    apiParams.brokerId = selectedBrokerId;
                }
                
                // The productivity call now also returns the list of brokers and manager KPIs.
                const [productivityRes, funnelRes] = await Promise.all([
                    api.getProductivityData(apiParams),
                    api.getFunnelAnalyticsData(apiParams),
                ]);

                setProductivityData(productivityRes);
                setFunnelAnalyticsData(funnelRes);

            } catch (err) {
                console.error("Failed to fetch manager data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange, selectedBrokerId]);

    const ManagerKpiCard: React.FC<{title: string, value: string | number}> = ({ title, value }) => (
        <div className="p-4 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex flex-col justify-between h-full">
            <h2 className="text-sm sm:text-base font-bold text-gray-300">{title}</h2>
            <p className="text-3xl sm:text-4xl font-extrabold mt-2 text-white break-words">
                {value}
            </p>
        </div>
    );

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-8">
                    <div id="productivity-section">
                        <h1 className="text-3xl font-bold text-white mb-2">Produtividade do Time</h1>
                        <FiltersBar 
                            dateRangeLabel={formatDateRange(dateRange)}
                            onDateRangeClick={() => setIsDatePickerOpen(true)}
                            brokers={productivityData?.brokers || []}
                            selectedBrokerId={selectedBrokerId}
                            onBrokerChange={setSelectedBrokerId}
                        />
                        
                        {loading || !productivityData ? (
                            <div className="text-center p-8">Carregando KPIs...</div>
                        ) : productivityData.managerKpis ? (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <ManagerKpiCard title="VGV do Mês" value={formatCurrency(productivityData.managerKpis.vgv)} />
                                <ManagerKpiCard title="Oportunidades" value={formatCurrency(productivityData.managerKpis.oportunidade)} />
                                <ManagerKpiCard title="Ligações" value={productivityData.managerKpis.ligacoes} />
                                <ManagerKpiCard title="Vendas" value={productivityData.managerKpis.vendas} />
                            </div>
                        ) : (
                             <div className="text-center p-8">Dados de KPI do gestor não disponíveis.</div>
                        )}
                    </div>

                    <div id="bi-section" className="mt-8 pt-8 border-t border-white/10">
                        <h1 className="text-3xl font-bold text-white mb-8">Dashboard de BI</h1>
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2 p-4 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
                                <h2 className="text-xl font-bold text-white mb-4">Análise Temporal</h2>
                                {loading || !productivityData ? <div className="text-center p-8">Carregando gráfico...</div> : (
                                    <LineChart data={productivityData.timeseries.daily} />
                                )}
                            </div>
                            <div className="p-4 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
                                <h2 className="text-xl font-bold text-white mb-4">Funil de Vendas</h2>
                                {loading || !funnelAnalyticsData ? <div className="text-center p-8">Carregando funil...</div> : (
                                    <Funnel data={funnelAnalyticsData} />
                                )}
                            </div>
                        </div>
                    </div>

                     <div id="breakdown-section" className="mt-8 pt-8 border-t border-white/10">
                         <h1 className="text-2xl font-bold text-white mb-6">Detalhamento</h1>
                         <div className="p-4 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
                            {loading || !productivityData ? <div className="text-center p-8">Carregando detalhamento...</div> : (
                                <Tabs>
                                    <div data-label="Por Origem">
                                        <BreakdownTable 
                                            data={productivityData.breakdown.porOrigem}
                                            headers={['Origem', 'Ligações', 'CE', 'Tratativas', 'Docs', 'Vendas']}
                                            dataKeys={['origem', 'ligacoes', 'ce', 'tratativas', 'documentacao', 'vendas']}
                                        />
                                    </div>
                                    {!selectedBrokerId && (
                                        <div data-label="Por Corretor">
                                            <BreakdownTable 
                                                data={productivityData.breakdown.porBroker}
                                                headers={['Corretor', 'Ligações', 'CE', 'Tratativas', 'Docs', 'Vendas']}
                                                dataKeys={['broker', 'ligacoes', 'ce', 'tratativas', 'documentacao', 'vendas']}
                                            />
                                        </div>
                                    )}
                                </Tabs>
                            )}
                         </div>
                    </div>
                </div>
            </div>

            <DateRangePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                initialRange={dateRange}
                onApply={(newRange) => {
                    setDateRange(newRange);
                    setIsDatePickerOpen(false);
                }}
            />
        </>
    );
};

export default ManagerDashboard;