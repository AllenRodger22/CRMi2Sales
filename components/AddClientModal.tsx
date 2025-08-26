import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Client } from '../types';

type ClientFormData = Omit<Client, 'id' | 'status' | 'interactions' | 'followUpState'>;

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: ClientFormData) => void;
  client?: Client; // Make client optional for add/edit functionality
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSubmit, client }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    phone: '',
    source: '',
    email: '',
    observations: '',
    product: '',
    propertyValue: '',
  });

  const isEditMode = !!client;

  useEffect(() => {
    if (isEditMode && isOpen) {
      setFormData({
        name: client.name,
        phone: client.phone,
        source: client.source,
        email: client.email || '',
        observations: client.observations || '',
        product: client.product || '',
        propertyValue: client.propertyValue || '',
      });
    } else if (!isOpen) {
      // Reset form when modal is closed
      setFormData({
        name: '', phone: '', source: '', email: '', observations: '', product: '', propertyValue: '',
      });
    }
  }, [client, isEditMode, isOpen]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.source) {
      alert('Nome, Número e Origem são obrigatórios.');
      return;
    }
    onSubmit(formData);
  };

  const inputClass = "appearance-none relative block w-full px-3 py-3 bg-white/5 border border-white/20 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="sr-only">Nome</label>
          <input id="name" value={formData.name} onChange={handleChange} required placeholder="Nome (obrigatório)" className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className="sr-only">Número</label>
          <input id="phone" value={formData.phone} onChange={handleChange} required placeholder="Número (obrigatório)" className={inputClass} />
        </div>
        <div>
          <label htmlFor="source" className="sr-only">Origem</label>
          <input id="source" value={formData.source} onChange={handleChange} required placeholder="Origem (obrigatório)" className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email (opcional)" className={inputClass} />
        </div>
        <div>
          <label htmlFor="product" className="sr-only">Produto</label>
          <input id="product" value={formData.product} onChange={handleChange} placeholder="Produto (opcional)" className={inputClass} />
        </div>
        <div>
          <label htmlFor="propertyValue" className="sr-only">Valor do imóvel</label>
          <input id="propertyValue" value={formData.propertyValue} onChange={handleChange} placeholder="Valor do imóvel (opcional)" className={inputClass} />
        </div>
        <div>
          <label htmlFor="observations" className="sr-only">Observações</label>
          <textarea id="observations" value={formData.observations} onChange={handleChange} placeholder="Observações" rows={3} className={inputClass} />
        </div>
        <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors">
                {isEditMode ? 'Salvar Alterações' : 'Salvar Cliente'}
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientFormModal;