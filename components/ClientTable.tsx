

import React from 'react';
// FIX: Changed to namespace import to fix module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';
import { Client, Role, ClientStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import Tag from './Tag';
import { ArchiveIcon, TrashIcon } from './Icons';

interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  onUpdateClient: (clientId: string, details: Partial<Client>) => void;
  onDeleteClient: (clientId: string) => void;
  onStatusChange: (clientId: string, fromStatus: ClientStatus, toStatus: ClientStatus) => void;
}

// FIX: Completed component definition, destructured all props, and implemented the table logic.
const ClientTable: React.FC<ClientTableProps> = ({ clients, loading, onUpdateClient, onDeleteClient, onStatusChange }) => {
    const { user } = useAuth();
    const navigate = ReactRouterDOM.useNavigate();

    const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>, clientId: string) => {
        // Prevent navigation when clicking on buttons inside the row
        if (e.target instanceof Element && e.target.closest('button')) {
            return;
        }
        // FIX: Corrected navigation path to be absolute and include the /dashboard prefix.
        navigate(`/dashboard/client/${clientId}`);
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <p>Carregando clientes...</p>
            </div>
        );
    }
    
    if (!clients || clients.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-400">Nenhum cliente encontrado.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
                <thead className="border-b border-white/20">
                    <tr>
                        <th className="p-4 font-semibold">Nome</th>
                        <th className="p-4 font-semibold">Número</th>
                        <th className="p-4 font-semibold">Origem</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map(client => (
                        <tr key={client.id} onClick={(e) => handleRowClick(e, client.id)} className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
                            <td className="p-4 font-medium text-white">{client.name}</td>
                            <td className="p-4">{client.phone}</td>
                            <td className="p-4">{client.source}</td>
                            <td className="p-4"><Tag status={client.status} /></td>
                            <td className="p-4 text-right space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(client.id, client.status, ClientStatus.ARCHIVED);
                                    }}
                                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                                    title="Arquivar Cliente"
                                >
                                    <ArchiveIcon className="w-5 h-5" />
                                </button>
                                {user?.role === Role.ADMIN && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteClient(client.id);
                                        }}
                                        className="p-2 text-red-400 hover:text-red-300 rounded-full hover:bg-white/10 transition-colors"
                                        title="Excluir Cliente"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// FIX: Added default export to resolve module import error in BrokerDashboard.
export default ClientTable;