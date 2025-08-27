import React, { useState, useMemo, useEffect, useRef } from 'react';
import KpiCard from '../components/KpiCard';
import ClientTable from '../components/ClientTable';
import { PlusIcon, UploadIcon, DownloadIcon, ChevronDownIcon } from '../components/Icons';
import ClientFormModal from '../components/AddClientModal';
import ImportCsvModal from '../components/ImportCsvModal';
import DateRangePickerModal from '../components/DateRangePickerModal';
import { ClientStatus, Client, Kpi, ProductivityData, InteractionType, FollowUpState, Role } from '../types';
import SearchBar from '../components/SearchBar';
import FiltersBar from '../components/FiltersBar';
import * as clientApi from '../services/clients';
import * as analyticsApi from '../services/analytics';
import * as interactionApi from '../services/interactions';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const productivityKpiColors: Record<keyof ProductivityData['kpis'], string> = {
    ligacoes: 'text-white',
    ce: 'text-white',
    tratativas: 'text-white',
    documentacao: 'text-white',
    vendas: 'text-white',
};

const productivityKpiTitles: Record<keyof ProductivityData['kpis'], string> = {
    ligacoes: 'Ligações',
    ce: 'Contatos Efetivos',
    tratativas: 'Tratativas',
    documentacao: 'Doc Completa',
    vendas: 'Vendas',
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


const BrokerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [brokerKpis, setBrokerKpis] = useState<Kpi[]>([]);
    const [productivityData, setProductivityData] = useState<ProductivityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateRange, setDateRange] = useState(getInitialDateRange());
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    
    const fetchClients = async () => {
        setLoading(true);
        try {
            const clientsRes = await clientApi.getAllClients({ q: searchQuery, status: statusFilter });
            setClients(clientsRes);
        } catch (err) {
            console.error("Failed to fetch client data", err);
            setClients([]);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (!user) return;
        
        const fetchStaticKpis = async () => {
            try {
                 const kpisRes = await analyticsApi.getBrokerKpis(user.id);
                 const kpisArray: Kpi[] = [
                    { title: 'Follow-up Atrasado', value: kpisRes.followUpAtrasado || 0, color: 'text-white' },
                    { title: 'Follow-up Futuro', value: kpisRes.leadsEmTratativa || 0, color: 'text-white' },
                    { title: 'Primeiro Atendimento', value: kpisRes.leadsPrimeiroAtendimento || 0, color: 'text-white' },
                    { title: 'Total de leads', value: kpisRes.totalLeads || 0, color: 'text-white' },
                ];
                setBrokerKpis(kpisArray);
            } catch (err) {
                 console.error("Failed to fetch kpi data", err);
                 setBrokerKpis([]);
            }
        };
        
        fetchClients();
        fetchStaticKpis();
    }, [searchQuery, statusFilter, user]);
    
    useEffect(() => {
        if (!user) return;
        const fetchProductivity = async () => {
            try {
                const apiParams = {
                    startDate: formatDateForApi(dateRange.start),
                    endDate: formatDateForApi(dateRange.end),
                    role: user.role,
                    currentUserId: user.id,
                };
                const productivityRes = await analyticsApi.getProductivityData(apiParams);
                setProductivityData(productivityRes);
            } catch (err) {
                console.error("Failed to fetch productivity data", err);
                setProductivityData(null);
            }
        };

        fetchProductivity();
    }, [dateRange, user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleAddClient = async (clientData: Omit<Client, 'id' | 'interactions'>) => {
        if (!user) return;
        try {
            await clientApi.createClient({ ...clientData, status: ClientStatus.FIRST_CONTACT }, user.id);
            // If filters are active, clearing them will trigger the useEffect to refetch.
            // Otherwise, we need to trigger the fetch manually.
            if (searchQuery || statusFilter) {
                setSearchQuery('');
                setStatusFilter('');
            } else {
                fetchClients();
            }
        } catch (err) {
            alert('Falha ao adicionar cliente.');
            console.error(err);
            throw err; // Re-throw error so the modal can handle it
        }
    };
    
    const updateClientDetails = async (clientId: string, details: Partial<Client>) => {
         try {
            await clientApi.updateClient(clientId, details);
            fetchClients(); // Refetch to ensure data consistency
        } catch (err) {
            alert('Falha ao atualizar cliente.');
            console.error(err);
        }
    };

    const handleClientStatusChange = async (clientId: string, fromStatus: ClientStatus, toStatus: ClientStatus) => {
        if (!user) return;
        try {
            await interactionApi.createInteraction({
                clientId,
                userId: user.id,
                type: InteractionType.STATUS_CHANGE,
                observation: `Status alterado de '${fromStatus}' para '${toStatus}'`,
                explicitNext: toStatus,
            });
            fetchClients(); // Refetch to see the change in the table
        } catch (err) {
            alert('Falha ao mudar status do cliente.');
            console.error(err);
        }
    };


    const deleteClient = async (clientId: string) => {
        if (!user || user.role !== Role.ADMIN) {
             alert('Apenas administradores podem excluir clientes.');
             return;
        }
         if (window.confirm('Tem certeza que deseja excluir este cliente permanentemente?')) {
            try {
                await clientApi.deleteClient(clientId);
                // If filters are active, clearing them will trigger the useEffect to refetch.
                // Otherwise, we need to trigger the fetch manually.
                if (searchQuery || statusFilter) {
                    setSearchQuery('');
                    setStatusFilter('');
                } else {
                    fetchClients();
                }
            } catch (err) {
                alert('Falha ao excluir cliente.');
                console.error(err);
            }
        }
    };

    const handleImportClients = async (file: File, mapping: Record<string, string>) => {
        if (!user) return;
        try {
            const result = await clientApi.importClients(file, mapping, user.id);
            alert(`${result.imported} clientes importados, ${result.skipped} ignorados.`);
            setIsImportModalOpen(false);
            if (searchQuery || statusFilter) {
                setSearchQuery('');
                setStatusFilter('');
            } else {
                fetchClients();
            }
        } catch (err: any) {
            alert(err.message || 'Falha ao importar clientes.');
            console.error(err);
        }
    };

    const handleExportCsv = async () => {
        setIsExportMenuOpen(false);
        try {
            const blob = await clientApi.exportClients();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            const toSnakeCase = (str: string | undefined) =>
                str
                    ? str
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                    : 'export';

            const userNameSnakeCase = toSnakeCase(user?.name);
            const exportDate = new Date().toISOString().split('T')[0];
            const filename = `${userNameSnakeCase}_${exportDate}.csv`;

            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Falha ao exportar clientes para CSV.');
            console.error(err);
        }
    };
    
    const handleExportPdf = () => {
        setIsExportMenuOpen(false);
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Relatório de Clientes', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Corretor: ${user?.name || 'N/A'}`, 14, 30);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 36);

        const tableColumn = ["Nome", "Número", "Origem", "Status"];
        const tableRows: (string | null | undefined)[][] = [];

        filteredClients.forEach(client => {
            const clientData = [
                client.name,
                client.phone,
                client.source,
                client.status,
            ];
            tableRows.push(clientData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'striped',
            headStyles: { fillColor: [234, 88, 12] }, // Orange color
        });
        
        const toSnakeCase = (str: string | undefined) =>
            str ? str.trim().toLowerCase().replace(/\s+/g, '_') : 'export';
        const userNameSnakeCase = toSnakeCase(user?.name);
        const exportDate = new Date().toISOString().split('T')[0];
        const filename = `${userNameSnakeCase}_${exportDate}.pdf`;

        doc.save(filename);
    };

    const handleFilterClick = (kpiTitle: string) => {
        setActiveFilter(prev => prev === kpiTitle ? null : kpiTitle);
    };
    
    const filteredClients = useMemo(() => {
        // Search and status filtering is now done by the backend.
        // This hook only applies the top-level KPI card filters.
        let results = clients;
        if (!activeFilter) return results;

        switch (activeFilter) {
            case 'Follow-up Atrasado':
                return results.filter(c => c.followUpState === FollowUpState.DELAYED);
            case 'Follow-up Futuro':
                return results.filter(c => c.followUpState === FollowUpState.ACTIVE);
            case 'Primeiro Atendimento':
                return results.filter(c => c.status === ClientStatus.FIRST_CONTACT);
            case 'Total de leads':
                return results.filter(c => c.status !== ClientStatus.ARCHIVED);
            default:
                return results;
        }
    }, [clients, activeFilter]);

    const allStatusOptions = Object.values(ClientStatus).filter(status =>
        status !== ClientStatus.CADENCE &&
        status !== ClientStatus.DOCS &&
        status !== ClientStatus.SALE
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-white">Dashboard do Corretor</h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {brokerKpis.map(kpi => (
                        <KpiCard 
                            key={kpi.title} 
                            title={kpi.title} 
                            value={kpi.value} 
                            color={kpi.color}
                            onClick={() => handleFilterClick(kpi.title)}
                            isActive={activeFilter === kpi.title}
                        />
                    ))}
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                     <h2 className="text-2xl font-bold text-white mb-4">Minha Produtividade</h2>
                    <FiltersBar 
                        dateRangeLabel={formatDateRange(dateRange)}
                        onDateRangeClick={() => setIsDatePickerOpen(true)}
                    />
                    {!productivityData ? <div className="text-center p-8">Carregando KPIs...</div> : (
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                            {(Object.keys(productivityData.kpis) as Array<keyof ProductivityData['kpis']>).map(key => (
                                <div key={key} className="p-4 sm:p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-lg flex flex-col justify-between h-full">
                                    <h3 className="text-sm sm:text-base font-bold text-gray-300">{productivityKpiTitles[key]}</h3>
                                    <p className={`text-3xl sm:text-4xl font-extrabold mt-2 ${productivityKpiColors[key]}`}>
                                        {productivityData.kpis[key]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
                    <div className="flex-grow">
                         <SearchBar onSearch={setSearchQuery} />
                    </div>
                    <div className="flex-grow md:flex-grow-0">
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full py-3 pl-4 pr-10 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="" className="bg-gray-800">Todos os Status</option>
                            {allStatusOptions.map(status => (
                                <option key={status} value={status} className="bg-gray-800">{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600/50 rounded-lg hover:bg-blue-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                            <UploadIcon className="w-5 h-5" /> Importar
                        </button>
                        <div className="relative" ref={exportMenuRef}>
                            <button 
                                onClick={() => setIsExportMenuOpen(prev => !prev)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600/50 rounded-lg hover:bg-green-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                <span>Exportar</span>
                                <ChevronDownIcon className="w-4 h-4" />
                            </button>
                            {isExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-800/90 backdrop-blur-xl border border-white/15 rounded-lg shadow-lg z-10">
                                    <button
                                        onClick={handleExportCsv}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                                    >
                                        Exportar para CSV
                                    </button>
                                    <button
                                        onClick={handleExportPdf}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                                    >
                                        Exportar para PDF (Visão Atual)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-white">Lista de Clientes</h2>
                        <button 
                            onClick={() => setIsAddClientModalOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600/80 rounded-lg hover:bg-orange-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                            <PlusIcon className="w-5 h-5" /> Cadastrar Cliente
                        </button>
                    </div>
                    <ClientTable 
                        clients={filteredClients} 
                        loading={loading} 
                        onUpdateClient={updateClientDetails} 
                        onDeleteClient={deleteClient}
                        onStatusChange={handleClientStatusChange}
                    />
                </div>

                <ClientFormModal 
                    isOpen={isAddClientModalOpen}
                    onClose={() => setIsAddClientModalOpen(false)}
                    onSubmit={handleAddClient}
                />
                <ImportCsvModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportClients}
                />
                 <DateRangePickerModal
                    isOpen={isDatePickerOpen}
                    onClose={() => setIsDatePickerOpen(false)}
                    initialRange={dateRange}
                    onApply={(newRange) => {
                        setDateRange(newRange);
                        setIsDatePickerOpen(false);
                    }}
                />
            </div>
        </div>
    );
};

export default BrokerDashboard;