import React, { useState } from 'react';
import Modal from './Modal';

type CallType = 'CE' | 'CNE';

interface LogCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (log: { type: CallType; details: string }) => void;
}

const CNE_REASONS = [
  'Não chamou',
  'Não atendeu',
  'Número errado',
  'Caixa postal',
  'Fora de área',
  'Número inválido',
];

const LogCallModal: React.FC<LogCallModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [callType, setCallType] = useState<CallType>('CE');
  const [note, setNote] = useState('');
  const [cneReason, setCneReason] = useState(CNE_REASONS[1]); // Default to "Não atendeu"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (callType === 'CE') {
      if (note.trim()) {
        onSubmit({ type: 'CE', details: note });
        setNote('');
        onClose();
      } else {
        alert('Por favor, preencha a anotação para Contato Efetivo.');
      }
    } else if (callType === 'CNE') {
      onSubmit({ type: 'CNE', details: cneReason });
      onClose();
    }
  };
  
  const inputClass = "appearance-none relative block w-full px-3 py-3 bg-white/5 border border-white/20 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Ligação">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Call Type Toggle */}
        <div className="flex bg-white/5 border border-white/20 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setCallType('CE')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
              callType === 'CE' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            Contato Efetivo (CE)
          </button>
          <button
            type="button"
            onClick={() => setCallType('CNE')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
              callType === 'CNE' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            Contato Não Efetivo (CNE)
          </button>
        </div>

        {/* Conditional Inputs */}
        {callType === 'CE' ? (
          <div>
            <label htmlFor="note" className="sr-only">Anotação</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              placeholder="Digite a anotação da ligação..."
              rows={4}
              className={inputClass}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="cneReason" className="sr-only">Motivo CNE</label>
            <select
              id="cneReason"
              value={cneReason}
              onChange={(e) => setCneReason(e.target.value)}
              className={inputClass}
            >
              {CNE_REASONS.map(reason => (
                <option key={reason} value={reason} className="bg-gray-800 text-white">
                  {reason}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors">
                Salvar Registro
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default LogCallModal;