import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';

interface DateRangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (range: { start: Date; end: Date }) => void;
  initialRange: { start: Date; end: Date };
}

const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({ isOpen, onClose, onApply, initialRange }) => {
    const [currentDate, setCurrentDate] = useState(new Date(initialRange.start));
    const [startDate, setStartDate] = useState<Date | null>(initialRange.start);
    const [endDate, setEndDate] = useState<Date | null>(initialRange.end);

    useEffect(() => {
        if (isOpen) {
            setStartDate(initialRange.start);
            setEndDate(initialRange.end);
            setCurrentDate(new Date(initialRange.start));
        }
    }, [isOpen, initialRange]);

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        clickedDate.setHours(0, 0, 0, 0);

        if (!startDate || (startDate && endDate)) {
            setStartDate(clickedDate);
            setEndDate(null);
        } else {
            if (clickedDate < startDate) {
                setEndDate(startDate);
                setStartDate(clickedDate);
            } else {
                const endOfDay = new Date(clickedDate);
                endOfDay.setHours(23, 59, 59, 999);
                setEndDate(endOfDay);
            }
        }
    };
    
    const changeMonth = (amount: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };

    const handleApply = () => {
        if(startDate && endDate) {
            onApply({ start: startDate, end: endDate });
        }
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid: (number | null)[] = Array(firstDayOfMonth).fill(null);
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push(i);
        }
        return grid;
    }, [currentDate]);

    const isSameDay = (d1: Date, d2: Date) => 
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Selecione um período">
            <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-white/10"><ArrowLeftIcon className="w-5 h-5" /></button>
                    <span className="font-bold text-lg">
                        {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-white/10"><ArrowRightIcon className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                    {weekDays.map((day, i) => <div key={i}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map((day, i) => {
                        if (!day) return <div key={`empty-${i}`}></div>;

                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        date.setHours(0, 0, 0, 0);

                        const isStartDate = startDate && isSameDay(date, startDate);
                        const isEndDate = endDate && isSameDay(date, new Date(endDate.getTime() - 1)); // Adjust for end of day
                        const isInRange = startDate && endDate && date > startDate && date < endDate;
                        const isToday = isSameDay(date, today);

                        let classes = 'w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors text-sm ';
                        if (isStartDate || isEndDate) {
                            classes += 'bg-orange-600 text-white font-bold';
                        } else if (isInRange) {
                            classes += 'bg-orange-500/30 hover:bg-orange-500/50 rounded-none';
                        } else {
                             classes += 'hover:bg-white/10';
                        }
                        if (isToday) {
                            classes += ' ring-2 ring-sky-400';
                        }

                        return (
                            <div key={day} onClick={() => handleDateClick(day)} className={classes}>
                                {day}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleApply} 
                        disabled={!startDate || !endDate}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        Aplicar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DateRangePickerModal;