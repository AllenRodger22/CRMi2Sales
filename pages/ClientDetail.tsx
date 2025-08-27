import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ClientStatus, InteractionType, Role, Client, FollowUpState } from '../types';
import TimelineItem from '../components/TimelineItem';
import Tag from '../components/Tag';
import ClientFormModal from '../components/AddClientModal';
import LogCallModal from '../components/LogCallModal';
import ResolveFollowUpModal, { FollowUpResolution } from '../components/ResolveFollowUpModal';
import { 
    ArrowLeftIcon, PencilIcon, SaveIcon, ClassicPhoneIcon, DoubleCheckIcon,
    CalendarIcon, TrashIcon, MessageCircleIcon, XIcon, NoSymbolIcon
} from '../components/Icons';
import * as api from '../services/mockApi';
import { FOLLOW_UP_STATE_COLORS } from '../constants';

const formatPhoneNumber = (phone: string) => {
    if (!phone) return { forTel: '', forWhatsApp: '' };
    const digitsOnly = phone.replace(/\D/g, '');
    const numberWithCountryCode = digitsOnly.startsWith('55') ? digitsOnly : `55${digitsOnly}`;
    return {
        forTel: `tel:+${numberWithCountryCode}`,
        forWhatsApp: `https://wa.me/${numberWithCountryCode}`,
    };
};

const formatCurrency = (value?: string | number): string => {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(String(value).replace(/[^0-9.,-]/g, '').replace(',', '.'));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(num);
};

const ClientDetail: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    
    const [newInteractionText, setNewInteractionText] = useState('');
    const [followUpDateTime, setFollowUpDateTime] = useState('');
    const [pendingFollowUpDate, setPendingFollowUpDate] = useState<Date | null>(null);
    
    const fetchClient = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const clientData = await api.getClient(clientId);
            setClient(clientData);
            
            const lastFollowUp = clientData.interactions?.find(
                (i: any) => i.type === InteractionType.FOLLOW_UP_SCHEDULED && !i.substituted
            );
            
            if (lastFollowUp && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(lastFollowUp.observation)) {
                const utcDate = new Date(lastFollowUp.observation);
                const localDateTime = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000))
                    .toISOString()
                    .slice(0, 16);
                setFollowUpDateTime(localDateTime);
            } else {
                setFollowUpDateTime('');
            }

        } catch (err: any) {
            setError(err.message || 'Falha ao buscar cliente.');
        } finally {
            setLoading(false);
        }
    }, [clientId]);


    useEffect(() => {
        fetchClient();
    }, [fetchClient]);
    
    const handleSaveNote = async () => {
        if (!clientId || !newInteractionText.trim()) return;
        const interactionData = {
            type: InteractionType.NOTE,
            observation: newInteractionText.trim(),
        };
        await api.createInteraction(clientId, interactionData);
        setNewInteractionText('');
        fetchClient();
    };

    const handleLoggedCallSubmit = async (log: { type: 'CE' | 'CNE'; details: string }) => {
        if (!clientId) return;
        const observation = `${log.type}: ${log.details}`;
        const interactionData = {
            type: InteractionType.LOGGED_CALL,
            observation,
        };
        await api.createInteraction(clientId, interactionData);
        setIsLogCallModalOpen(false);
        fetchClient();
    };

    const handleStatusChange = async (newStatus: ClientStatus) => {
        if (!clientId || client?.status === newStatus) return;
        const interactionData = {
            type: InteractionType.STATUS_CHANGE,
            from_status: client?.status,
            to_status: newStatus,
            observation: `Status alterado de '${client?.status}' para '${newStatus}'`,
        };
        await api.createInteraction(clientId, interactionData);
        fetchClient();
    };

    const scheduleNewFollowUp = async (dateToSchedule: Date) => {
        if (!clientId) return;
        const interactionData = {
            type: InteractionType.FOLLOW_UP_SCHEDULED,
            observation: dateToSchedule.toISOString(),
        };
        try {
            await api.createInteraction(clientId, interactionData);
            if (client && client.followUpState !== FollowUpState.ACTIVE) {
                await api.updateClient(clientId, { followUpState: FollowUpState.ACTIVE });
            }
            fetchClient();
        } catch (err) {
            console.error('Failed to schedule follow-up:', err);
            alert('Ocorreu um erro ao agendar o follow-up. Por favor, tente novamente.');
        }
    };

    const initiateScheduleProcess = async (dateToSchedule: Date) => {
         if (dateToSchedule < new Date()) {
            alert('Não é possível agendar um follow-up no passado.');
            return;
        }
        
        if (client && (client.followUpState === FollowUpState.ACTIVE || client.followUpState === FollowUpState.DELAYED)) {
            setPendingFollowUpDate(dateToSchedule);
            setIsResolveModalOpen(true);
            return;
        }
        
        await scheduleNewFollowUp(dateToSchedule);
    };
    
    const handleManualSchedule = () => {
        if (!followUpDateTime) {
            alert('Por favor, selecione uma data e hora para o follow-up.');
            return;
        }
        initiateScheduleProcess(new Date(followUpDateTime));
    };

    const handleQuickSchedule = (days: number) => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(9, 0, 0, 0); // Default to 9:00 AM
        initiateScheduleProcess(targetDate);
    };

    
    const handleCompleteFollowUp = async (shouldRefetch = true) => {
        if (!clientId) return;
        await api.createInteraction(clientId, {
            type: InteractionType.FOLLOW_UP_COMPLETED,
            observation: 'Follow-up concluído.',
        });
        await api.updateClient(clientId, { followUpState: FollowUpState.COMPLETED });
        if (shouldRefetch) fetchClient();
    };

    const handleCancelFollowUp = async (shouldRefetch = true) => {
        if (!clientId) return;
        await api.createInteraction(clientId, {
            type: InteractionType.FOLLOW_UP_CANCELED,
            observation: 'Follow-up cancelado.',
        });
        await api.updateClient(clientId, { followUpState: FollowUpState.CANCELED });
        if (shouldRefetch) fetchClient();
    };
    
    const handleMarkAsLost = async (shouldRefetch = true) => {
        if (!clientId) return;
        await api.createInteraction(clientId, {
            type: InteractionType.FOLLOW_UP_LOST,
            observation: 'Follow-up marcado como perdido.',
        });
        await api.updateClient(clientId, { followUpState: FollowUpState.LOST });
        if (shouldRefetch) fetchClient();
    };
    
    const handleResolveAndSchedule = async (resolution: FollowUpResolution) => {
        setIsResolveModalOpen(false);
        if (!pendingFollowUpDate) return;

        switch (resolution) {
            case 'complete':
                await handleCompleteFollowUp(false);
                break;
            case 'lost':
                await handleMarkAsLost(false);
                break;
            case 'cancel':
                await handleCancelFollowUp(false);
                break;
        }
        await scheduleNewFollowUp(pendingFollowUpDate);
        setPendingFollowUpDate(null);
    };

    const handleUpdateClient = async (updatedData: Omit<Client, 'id' | 'status' | 'interactions' | 'followUpState'>) => {
        if (!clientId) return;
        await api.updateClient(clientId, updatedData);
        setIsEditModalOpen(false);
        fetchClient();
    };

    if (loading) return <div className="text-center p-8">Carregando cliente...</div>;
    if (error) return <div className="text-center p-8 text-red-400">{error}</div>;
    if (!client) return <div className="text-center p-8">Cliente não encontrado.</div>;

    const allStatusOptions = Object.values(ClientStatus).filter(status => ![ClientStatus.CADENCE, ClientStatus.DOCS, ClientStatus.SALE].includes(status));
    const phoneLinks = formatPhoneNumber(client.phone);
    const followUpColor = FOLLOW_UP_STATE_COLORS[client.followUpState] || FOLLOW_UP_STATE_COLORS[FollowUpState.NO_FOLLOW_UP];
    
    const interactionButtonClass = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600/50 rounded-lg hover:bg-gray-700/60 transition-colors";

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Voltar para o Dashboard
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Interactions & Timeline */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-white">{client.name}</h1>
                            <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Tag status={client.status} />
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${followUpColor}`}>
                                {client.followUpState}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-400">{client.phone}  &middot;  Origem: {client.source}</p>
                    
                    {/* Add Interaction Card */}
                    <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Adicionar Interação</h2>
                        <textarea
                            value={newInteractionText}
                            onChange={(e) => setNewInteractionText(e.target.value)}
                            placeholder="Digite aqui para registrar uma interação..."
                            rows={3}
                            className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button onClick={handleSaveNote} className={interactionButtonClass}>
                                <SaveIcon className="w-5 h-5" /> Salvar Anotação
                            </button>
                            <a href={phoneLinks.forWhatsApp} target="_blank" rel="noopener noreferrer" className={interactionButtonClass}>
                                <MessageCircleIcon className="w-5 h-5" /> WhatsApp
                            </a>
                            <a href={phoneLinks.forTel} className={interactionButtonClass}>
                                <ClassicPhoneIcon className="w-5 h-5" /> Ligar
                            </a>
                            <button onClick={() => setIsLogCallModalOpen(true)} className={interactionButtonClass}>
                                <DoubleCheckIcon className="w-5 h-5" /> Registrar Ligação
                            </button>
                        </div>
                    </div>
                    
                    {/* Timeline Card */}
                    <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-6">Linha do Tempo</h2>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                           {client.interactions.map(interaction => (
                                <TimelineItem key={interaction.id} interaction={interaction} />
                           ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Info */}
                <div className="space-y-8">
                    <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Ações</h2>
                        
                        {/* Status Change */}
                        <div>
                            <h3 className="text-md font-semibold text-gray-300 mb-3">Mudar Status</h3>
                            <div className="flex flex-wrap gap-2">
                                {allStatusOptions.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        disabled={client.status === status}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                            client.status === status
                                                ? 'bg-orange-600 text-white cursor-default'
                                                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Follow-up */}
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <h3 className="text-md font-semibold text-gray-300 mb-3">Agendar Follow-up</h3>
                            
                            {client.followUpState === FollowUpState.DELAYED ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-red-400">Este follow-up está atrasado. Resolva antes de agendar um novo.</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleCompleteFollowUp()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600/50 rounded-lg hover:bg-green-700/60">
                                            <DoubleCheckIcon className="w-5 h-5" /> Concluir
                                        </button>
                                        <button onClick={() => handleMarkAsLost()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600/50 rounded-lg hover:bg-rose-700/60">
                                            <NoSymbolIcon className="w-5 h-5" /> Perdido
                                        </button>
                                        <button onClick={() => handleCancelFollowUp()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600/50 rounded-lg hover:bg-red-700/60">
                                            <XIcon className="w-5 h-5" /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                     <input
                                        type="datetime-local"
                                        value={followUpDateTime}
                                        onChange={e => setFollowUpDateTime(e.target.value)}
                                        className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <button onClick={handleManualSchedule} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600/80 rounded-lg hover:bg-orange-700/80 transition-colors">
                                        <CalendarIcon className="w-5 h-5" /> Agendar Follow-up
                                    </button>
                                     <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleQuickSchedule(1)}
                                            className="w-full text-center py-2 px-3 text-xs font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            Amanhã (9:00)
                                        </button>
                                        <button
                                            onClick={() => handleQuickSchedule(7)}
                                            className="w-full text-center py-2 px-3 text-xs font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            Daqui a 7 dias (9:00)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Informações Adicionais</h2>
                        <div className="space-y-2 text-sm">
                            <p><strong className="text-gray-400">Produto:</strong> {client.product || 'N/A'}</p>
                            <p><strong className="text-gray-400">Valor do Imóvel:</strong> {formatCurrency(client.propertyValue) || 'N/A'}</p>
                            <p className="pt-2"><strong className="text-gray-400">Observações:</strong></p>
                            <p className="text-gray-300 whitespace-pre-wrap">{client.observations || 'Nenhuma'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <ClientFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateClient}
                client={client}
            />
            <LogCallModal
                isOpen={isLogCallModalOpen}
                onClose={() => setIsLogCallModalOpen(false)}
                onSubmit={handleLoggedCallSubmit}
            />
            <ResolveFollowUpModal
                isOpen={isResolveModalOpen}
                onClose={() => {
                    setIsResolveModalOpen(false);
                    setPendingFollowUpDate(null);
                }}
                onResolve={handleResolveAndSchedule}
            />
        </div>
    );
};

export default ClientDetail;