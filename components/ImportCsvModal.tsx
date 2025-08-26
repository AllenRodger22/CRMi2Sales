import React, { useState, ChangeEvent, useEffect } from 'react';
import Modal from './Modal';
import { UploadIcon } from './Icons';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
}

const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ isOpen, onClose, onImport }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal is closed
            setSelectedFile(null);
        }
    }, [isOpen]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            setSelectedFile(file);
        } else {
            alert('Por favor, selecione um arquivo .csv válido.');
            setSelectedFile(null);
        }
        e.target.value = ''; // Allow re-uploading the same file
    };

    const handleImportClick = () => {
        if (selectedFile) {
            onImport(selectedFile);
        } else {
            alert('Por favor, selecione um arquivo para importar.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Clientes via CSV">
            <div className="space-y-6">
                <label htmlFor="csv-upload" className="cursor-pointer block">
                    <div className="p-10 border-2 border-dashed border-white/20 rounded-lg hover:bg-white/5 transition-colors text-center">
                        <UploadIcon className="w-12 h-12 mx-auto text-gray-400"/>
                        <p className="mt-4 text-lg font-semibold">
                            {selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo'}
                        </p>
                        <p className="text-sm text-gray-400">
                            {selectedFile ? `Tamanho: ${(selectedFile.size / 1024).toFixed(2)} KB` : 'Arquivo .CSV (máx 5MB)'}
                        </p>
                    </div>
                    <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </label>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleImportClick} 
                        disabled={!selectedFile}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Importar Arquivo
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ImportCsvModal;