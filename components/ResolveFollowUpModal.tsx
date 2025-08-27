import React from 'react';
import Modal from './Modal';
import { DoubleCheckIcon, XIcon, NoSymbolIcon } from './Icons';

export type FollowUpResolution = 'complete' | 'lost' | 'cancel';

interface ResolveFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (resolution: FollowUpResolution) => void;
}

const ResolveFollowUpModal: React.FC<ResolveFollowUpModalProps> = ({
  isOpen,
  onClose,
  onResolve,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolver Follow-up Pendente">
      <div className="space-y-6">
        <p className="text-gray-300">
          Este cliente já possui um follow-up ativo ou atrasado. Para agendar um novo,
          primeiro é necessário resolver o follow-up atual.
        </p>
        <p className="text-gray-300 font-semibold">Como deseja prosseguir?</p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => onResolve('complete')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600/80 rounded-lg hover:bg-green-700/80 transition-colors"
          >
            <DoubleCheckIcon className="w-5 h-5" /> Concluir e Agendar Novo
          </button>
           <button
            onClick={() => onResolve('lost')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600/80 rounded-lg hover:bg-rose-700/80 transition-colors"
          >
            <NoSymbolIcon className="w-5 h-5" /> Marcar como Perdido e Agendar
          </button>
          <button
            onClick={() => onResolve('cancel')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600/80 rounded-lg hover:bg-red-700/80 transition-colors"
          >
            <XIcon className="w-5 h-5" /> Cancelar e Agendar Novo
          </button>
        </div>
        <div className="flex justify-end pt-4 mt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Voltar (Não agendar)
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ResolveFollowUpModal;