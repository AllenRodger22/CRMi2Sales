import React from 'react';
import { useNavigate } from 'react-router-dom';
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

const ClientTable: React.FC<ClientTableProps> = ({ clients, loading, onUpdateClient, onDeleteClient, onStatusChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleArchive = (client: Client) => {
    onStatusChange(client.id, client.status, ClientStatus.ARCHIVED);
  };

  const handleRowClick = (clientId: string) => {
    navigate(`/client/${clientId}`);
  };
  
  if (loading) {
    return <div className="text-center text-gray-400">Carregando clientes...</div>;
  }
  
  return (
    <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="border-b border-white/20 sticky top-0 bg-gray-900/70 backdrop-blur-lg">
          <tr>
            <th className="p-4">Nome</th>
            <th className="p-4">Número</th>
            <th className="p-4">Origem</th>
            <th className="p-4">Status</th>
            {(user?.role === Role.ADMIN || user?.role === Role.MANAGER) && <th className="p-4 text-right">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr 
              key={client.id} 
              className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => handleRowClick(client.id)}
            >
              <td className="p-4 font-medium text-white">{client.name}</td>
              <td className="p-4">{client.phone}</td>
              <td className="p-4">{client.source}</td>
              <td className="p-4">
                <Tag status={client.status} />
              </td>
              {(user?.role === Role.ADMIN || user?.role === Role.MANAGER) && (
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                     <button 
                        onClick={() => handleArchive(client)}
                        className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded-full transition-colors"
                        title="Arquivar cliente"
                      >
                       <ArchiveIcon className="h-5 w-5" />
                     </button>
                     {user?.role === Role.ADMIN && (
                        <button
                            onClick={() => onDeleteClient(client.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-full transition-colors"
                            title="Excluir cliente permanentemente"
                        >
                        <TrashIcon className="h-5 w-5" />
                        </button>
                     )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;