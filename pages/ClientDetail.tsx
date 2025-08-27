

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
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
import * as clientApi from '../services/clients';
import * as interactionApi from '../services/interactions';
import { FOLLOW_UP_STATE_COLORS } from '../constants';
import { parseCurrency } from '../utils/helpers';

const formatPhoneNumber = (phone: string) => {
    if (!phone) return { forTel: '', forWhatsApp: '' };
    const digitsOnly = phone.replace(/\D/g, '');
    const numberWithCountryCode = digitsOnly.startsWith('55') ? digitsOnly : `55${digitsOnly}`;
    return {
        forTel: `tel:+${numberWithCountryCode}`,
        forWhatsApp: `https://wa.me/${numberWithCountryCode}`,
    };
};

const formatCurrencyForDisplay = (value?: string | number): string => {
    const num = parseCurrency(value);
    if (num === null) return 'N/A';
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
            const clientData = await clientApi.getClient(clientId);
            setClient(clientData);
            
            const lastFollowUp = clientData.interactions?.find(
                (i: any) => i.type === InteractionType.FOLLOW_UP_SCHEDULED && !i.substituted
            );
            
            if (lastFollowUp && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?Z$/.test(lastFollowUp.observation)) {
                const utcDate = new Date(lastFollowUp.observation);
                // Convert UTC to local time for the input
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
        if (!clientId || !newInteractionText.trim() || !user) return;
        
        await interactionApi.createInteraction({
            clientId,
            userId: user.id,
            type: InteractionType.NOTE,
            observation: newInteractionText.trim(),
        });
        setNewInteractionText('');
        fetchClient();
    };

    const handleLoggedCallSubmit = async (log: { type: 'CE' | 'CNE'; details: string }) => {
        if (!clientId || !user) return;
        const observation = `${log.type}: ${log.details}`;
        
        await interactionApi.createInteraction({
            clientId,
            userId: user.id,
            type: InteractionType.LOGGED_CALL,
            observation,
        });
        setIsLogCallModalOpen(false);
        fetchClient();
    };

    const handleStatusChange = async (newStatus: ClientStatus) => {
        if (!clientId || !user || client?.status === newStatus) return;
        
        await interactionApi.createInteraction({
            clientId,
            userId: user.id,
            type: InteractionType.STATUS_CHANGE,
            explicitNext: newStatus,
            observation: `Status alterado de '${client?.status}' para '${newStatus}'`,
        });
        fetchClient();
    };

    const scheduleNewFollowUp = async (dateToSchedule: Date) => {
        if (!clientId || !user) return;
        try {
            await interactionApi.createInteraction({
                clientId,
                userId: user.id,
                type: InteractionType.FOLLOW_UP_SCHEDULED,
                observation: dateToSchedule.toISOString(),
            });
            if (client && client.followUpState !== FollowUpState.ACTIVE) {
                await clientApi.updateClient(clientId, { followUpState: FollowUpState.ACTIVE });
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
        if (!clientId || !user) return;
        try {
            await interactionApi.createInteraction({
                clientId,
                userId: user.id,
                type: InteractionType.FOLLOW_UP_COMPLETED,
                observation: 'Follow-up concluído.',
            });
            await clientApi.updateClient(clientId, { followUpState: FollowUpState.COMPLETED });
            if (shouldRefetch) fetchClient();
        } catch (err) {
            console.error('Failed to complete follow-up:', err);
            alert('Ocorreu um erro ao concluir o follow-up.');
        }
    };

    const handleLostFollowUp = async (shouldRefetch = true) => {
        if (!clientId || !user) return;
        try {
            await interactionApi.createInteraction({
                clientId,
                userId: user.id,
                type: InteractionType.FOLLOW_UP_LOST,
                observation: 'Follow-up marcado como perdido.',
            });
            await clientApi.updateClient(clientId, { followUpState: FollowUpState.LOST });
            if (shouldRefetch) fetchClient();
        } catch (err) {
            console.error('Failed to mark follow-up as lost:', err);
            alert('Ocorreu um erro ao marcar o follow-up como perdido.');
        }
    };
    
    const handleCancelFollowUp = async (shouldRefetch = true) => {
        if (!clientId || !user) return;
        try {
            await interactionApi.createInteraction({
                clientId,
                userId: user.id,
                type: InteractionType.FOLLOW_UP_CANCELED,
                observation: 'Follow-up cancelado.',
            });
            await clientApi.updateClient(clientId, { followUpState: FollowUpState.CANCELED });
            if (shouldRefetch) fetchClient();
        } catch (err) {
            console.error('Failed to cancel follow-up:', err);
            alert('Ocorreu um erro ao cancelar o follow-up.');
        }
    };

    const handleResolveFollowUp = async (resolution: FollowUpResolution) => {
        setIsResolveModalOpen(false);
        if (!pendingFollowUpDate) return;

        if (resolution === 'complete') await handleCompleteFollowUp(false);
        else if (resolution === 'lost') await handleLostFollowUp(false);
        else if (resolution === 'cancel') await handleCancelFollowUp(false);
        
        await scheduleNewFollowUp(pendingFollowUpDate);

        setPendingFollowUpDate(null);
    };

    const handleUpdateClient = async (updatedData: Partial<Client>) => {
        if (!clientId) return;
        try {
            await clientApi.updateClient(clientId, updatedData);
            fetchClient();
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Failed to update client", err);
            alert('Falha ao atualizar cliente.');
        }
    };

    const handleDeleteClient = async () => {
        if (!clientId || user?.role !== Role.ADMIN) return;
        if (window.confirm('Tem certeza que deseja excluir este cliente permanentemente?')) {
            try {
                await clientApi.deleteClient(clientId);
                navigate('/dashboard');
            } catch (err) {
                console.error("Failed to delete client", err);
                alert('Falha ao excluir o cliente.');
            }
        }
    };

    if (loading) return <div className="text-center p-8 text-white">Carregando cliente...</div>;
    if (error) return <div className="text-center p-8 text-red-400">Erro: {error}</div>;
    if (!client) return <div className="text-center p-8 text-white">Cliente não encontrado.</div>;
    
    const { forTel, forWhatsApp } = formatPhoneNumber(client.phone);
    
    const allStatusOptions = Object.values(ClientStatus).filter(status =>
        status !== ClientStatus.CADENCE &&
        status !== ClientStatus.DOCS &&
        status !== ClientStatus.SALE
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <Link
                    to="/dashboard"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Voltar para o Dashboard
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-white">{client.name}</h1>
                                <Tag status={client.status} />
                            </div>
                            <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                         <div className={`mt-2 p-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${FOLLOW_UP_STATE_COLORS[client.followUpState]}`}>
                           {client.followUpState}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-3">
                        <h2 className="font-bold text-white">Ações Rápidas</h2>
                        <a href={forWhatsApp} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600/80 rounded-lg hover:bg-green-700/80 transition-colors">
                            <MessageCircleIcon className="w-5 h-5" /> WhatsApp
                        </a>
                         <a href={forTel} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-700/80 transition-colors">
                            <ClassicPhoneIcon className="w-5 h-5" /> Ligar
                        </a>
                        <button onClick={() => setIsLogCallModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600/80 rounded-lg hover:bg-sky-700/80 transition-colors">
                            <DoubleCheckIcon className="w-5 h-5" /> Registrar Ligação
                        </button>
                    </div>

                    <div className="p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-3 text-sm">
                        <h2 className="font-bold text-white mb-2">Detalhes</h2>
                        <p><strong className="text-gray-400">Número:</strong> {client.phone}</p>
                        <p><strong className="text-gray-400">Email:</strong> {client.email || 'N/A'}</p>
                        <p><strong className="text-gray-400">Origem:</strong> {client.source}</p>
                        <p><strong className="text-gray-400">Produto:</strong> {client.product || 'N/A'}</p>
                        <p><strong className="text-gray-400">Valor do Imóvel:</strong> {formatCurrencyForDisplay(client.propertyValue)}</p>
                        <p className="pt-2 border-t border-white/10"><strong className="text-gray-400">Observações:</strong> {client.observations || 'N/A'}</p>
                        {user?.role === Role.ADMIN && (
                            <div className="pt-4 mt-4 border-t border-red-500/20">
                                 <button onClick={handleDeleteClient} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600/50 rounded-lg hover:bg-red-700/60 transition-colors">
                                    <TrashIcon className="w-5 h-5" /> Excluir Cliente
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-3">
                        <h2 className="font-bold text-white">Mudar Status</h2>
                         <select
                            value={client.status}
                            onChange={(e) => handleStatusChange(e.target.value as ClientStatus)}
                            className="w-full py-3 pl-4 pr-10 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            {allStatusOptions.map(status => (
                                <option key={status} value={status} className="bg-gray-800">{status}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                     <div className="p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                         <h2 className="font-bold text-white mb-4">Agendar Follow-up</h2>
                         <div className="space-y-3">
                             <div className="flex items-center gap-2">
                                <input 
                                    type="datetime-local"
                                    value={followUpDateTime}
                                    onChange={(e) => setFollowUpDateTime(e.target.value)}
                                    className="flex-grow w-full py-2 pl-3 pr-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <button onClick={handleManualSchedule} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors">
                                    <CalendarIcon className="w-5 h-5"/>
                                </button>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => handleQuickSchedule(1)} className="flex-1 px-2 py-1 text-xs text-center text-gray-300 bg-white/10 rounded-md hover:bg-white/20">Amanhã</button>
                                 <button onClick={() => handleQuickSchedule(2)} className="flex-1 px-2 py-1 text-xs text-center text-gray-300 bg-white/10 rounded-md hover:bg-white/20">2 dias</button>
                                 <button onClick={() => handleQuickSchedule(7)} className="flex-1 px-2 py-1 text-xs text-center text-gray-300 bg-white/10 rounded-md hover:bg-white/20">7 dias</button>
                             </div>
                         </div>
                     </div>
                
                    <div className="p-6 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
                        <h2 className="font-bold text-white mb-4">Histórico e Anotações</h2>
                        <div className="space-y-4">
                            <textarea
                                value={newInteractionText}
                                onChange={(e) => setNewInteractionText(e.target.value)}
                                placeholder="Adicionar uma anotação..."
                                rows={3}
                                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <div className="text-right">
                                <button
                                    onClick={handleSaveNote}
                                    disabled={!newInteractionText.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-800 disabled:cursor-not-allowed"
                                >
                                    Salvar Anotação
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-white/10 pt-6">
                            <div className="relative">
                                <div className="absolute left-5 top-2 bottom-2 w-px bg-white/10 hidden sm:block"></div>
                                <div className="space-y-4">
                                    {client.interactions.map(interaction => (
                                        <TimelineItem key={interaction.id} interaction={interaction} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
             <ClientFormModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={(data) => handleUpdateClient(data as Partial<Client>)}
                client={client}
             />
             <LogCallModal 
                isOpen={isLogCallModalOpen}
                onClose={() => setIsLogCallModalOpen(false)}
                onSubmit={handleLoggedCallSubmit}
             />
             <ResolveFollowUpModal 
                isOpen={isResolveModalOpen}
                onClose={() => setIsResolveModalOpen(false)}
                onResolve={handleResolveFollowUp}
             />
        </div>
    );
};

export default ClientDetail;
