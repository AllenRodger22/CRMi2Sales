import React, { useState, ChangeEvent, useEffect } from 'react';
import Modal from './Modal';
import { UploadIcon } from './Icons';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, mapping: Record<string, string>) => void;
}

const DB_FIELDS = [
    { key: 'name', label: 'Nome', required: true },
    { key: 'phone', label: 'Número', required: true },
    { key: 'source', label: 'Origem', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'observations', label: 'Observações', required: false },
    { key: 'product', label: 'Produto', required: false },
    { key: 'propertyValue', label: 'Valor do Imóvel', required: false },
];


const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ isOpen, onClose, onImport }) => {
    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal is closed
            setStep(1);
            setSelectedFile(null);
            setHeaders([]);
            setMapping({});
        }
    }, [isOpen]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const firstLine = text.split('\n')[0].trim();
                const parsedHeaders = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
                setHeaders(parsedHeaders);
                // Auto-map based on common names
                const initialMapping: Record<string, string> = {};
                parsedHeaders.forEach(header => {
                    const lowerHeader = header.toLowerCase();
                    const foundField = DB_FIELDS.find(field => 
                        lowerHeader.includes(field.label.toLowerCase()) || lowerHeader.includes(field.key.toLowerCase())
                    );
                    if (foundField) {
                        initialMapping[header] = foundField.key;
                    }
                });
                setMapping(initialMapping);
                setStep(2); // Move to mapping step
            };
            reader.readAsText(file);
        } else {
            alert('Por favor, selecione um arquivo .csv válido.');
            setSelectedFile(null);
        }
        e.target.value = ''; // Allow re-uploading the same file
    };

    const handleMappingChange = (header: string, dbField: string) => {
        setMapping(prev => ({ ...prev, [header]: dbField }));
    };

    const handleImportClick = () => {
        if (!selectedFile) return;

        const mappedDbFields = Object.values(mapping);
        const requiredFields = DB_FIELDS.filter(f => f.required);
        const missingFields = requiredFields.filter(f => !mappedDbFields.includes(f.key));
        
        if (missingFields.length > 0) {
            alert(`Por favor, mapeie os campos obrigatórios: ${missingFields.map(f => f.label).join(', ')}`);
            return;
        }

        onImport(selectedFile, mapping);
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <label htmlFor="csv-upload" className="cursor-pointer block">
                <div className="p-10 border-2 border-dashed border-white/20 rounded-lg hover:bg-white/5 transition-colors text-center">
                    <UploadIcon className="w-12 h-12 mx-auto text-gray-400"/>
                    <p className="mt-4 text-lg font-semibold">
                        Clique para selecionar um arquivo
                    </p>
                    <p className="text-sm text-gray-400">
                        Arquivo .CSV (máx 5MB)
                    </p>
                </div>
                <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </label>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    Cancelar
                </button>
            </div>
        </div>
    );
    
    const renderStep2 = () => (
        <div className="space-y-4">
            <p className="text-sm text-gray-300">
                Associe cada coluna do seu arquivo CSV a um campo correspondente no sistema.
                Os campos com <span className="text-red-400">*</span> são obrigatórios.
            </p>
            <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                {headers.map(header => (
                    <div key={header} className="grid grid-cols-2 gap-4 items-center">
                        <span className="font-medium text-white truncate" title={header}>{header}</span>
                        <select
                            value={mapping[header] || ''}
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                            className="w-full py-2 pl-3 pr-8 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="" className="bg-gray-800">Ignorar esta coluna</option>
                            {DB_FIELDS.map(field => (
                                <option key={field.key} value={field.key} className="bg-gray-800">
                                    {field.label} {field.required && '*'}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
             <div className="flex justify-between items-center gap-4 pt-4 mt-4 border-t border-white/15">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    Voltar
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
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={step === 1 ? "Importar Clientes (Passo 1/2)" : "Mapear Colunas (Passo 2/2)"}
        >
            {step === 1 ? renderStep1() : renderStep2()}
        </Modal>
    );
};

export default ImportCsvModal;