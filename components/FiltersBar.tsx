import React from 'react';
import { CalendarIcon, BriefcaseIcon } from './Icons';

interface FiltersBarProps {
    onDateRangeClick: () => void;
    dateRangeLabel: string;
    brokers?: { id: string, name: string }[];
    selectedBrokerId?: string;
    onBrokerChange?: (brokerId: string) => void;
}

const FiltersBar: React.FC<FiltersBarProps> = ({ 
    onDateRangeClick, 
    dateRangeLabel,
    brokers,
    selectedBrokerId,
    onBrokerChange
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-center p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="relative w-full md:w-auto">
                <label htmlFor="date-range-button" className="sr-only">Período</label>
                <button
                    id="date-range-button"
                    onClick={onDateRangeClick}
                    className="w-full text-left md:w-64 bg-white/5 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                    {dateRangeLabel}
                </button>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
            </div>
             {brokers && onBrokerChange && (
                <div className="relative w-full md:w-auto">
                    <label htmlFor="broker-select" className="sr-only">Corretor</label>
                    <select
                        id="broker-select"
                        value={selectedBrokerId}
                        onChange={(e) => onBrokerChange(e.target.value)}
                        className="w-full appearance-none md:w-64 bg-white/5 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="" className="bg-gray-800">Todos os Corretores</option>
                        {brokers.map(broker => (
                            <option key={broker.id} value={broker.id} className="bg-gray-800">
                                {broker.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiltersBar;