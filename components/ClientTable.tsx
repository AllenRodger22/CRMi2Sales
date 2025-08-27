

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
                        <th className="p-4 font-semibold hidden md:table-cell">Número</th>
                        <th className="p-4 font-semibold hidden lg:table-cell">Origem</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map((client) => (
                        <tr 
                            key={client.id} 
                            className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={(e) => handleRowClick(e, client.id)}
                        >
                            <td className="p-4 font-medium text-white">{client.name}</td>
                            <td className="p-4 hidden md:table-cell">{client.phone}</td>
                            <td className="p-4 hidden lg:table-cell">{client.source}</td>
                            <td className="p-4">
                                <Tag status={client.status} />
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); client.status !== ClientStatus.ARCHIVED && onStatusChange(client.id, client.status, ClientStatus.ARCHIVED); }}
                                        className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={client.status !== ClientStatus.ARCHIVED ? "Arquivar Cliente" : "Cliente já arquivado"}
                                        disabled={client.status === ClientStatus.ARCHIVED}
                                    >
                                        <ArchiveIcon className="w-5 h-5" />
                                    </button>
                                    {user?.role === Role.ADMIN && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteClient(client.id); }}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                                            title="Excluir Cliente"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// FIX: Added default export to match project conventions and fix import errors.
export default ClientTable;
