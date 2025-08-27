import React, { useState, useEffect } from 'react';
import { Interaction, InteractionType } from '../types';
import { formatRelativeTime } from '../utils/date';
import { 
    MessageCircleIcon, ClassicPhoneIcon, TagIcon, CalendarIcon, UserPlusIcon, 
    HeadsetIcon, FaceFrownIcon, SaveIcon, DoubleCheckIcon, XIcon, NoSymbolIcon
} from './Icons';

const iconMap: Record<InteractionType, { icon: React.FC<any>, color: string }> = {
    [InteractionType.NOTE]: { icon: SaveIcon, color: 'bg-gray-500/30' },
    [InteractionType.WHATSAPP]: { icon: MessageCircleIcon, color: 'bg-green-500/30' },
    [InteractionType.CALL_INITIATED]: { icon: ClassicPhoneIcon, color: 'bg-blue-500/30' },
    [InteractionType.LOGGED_CALL]: { icon: DoubleCheckIcon, color: 'bg-sky-500/30' },
    [InteractionType.STATUS_CHANGE]: { icon: TagIcon, color: 'bg-purple-500/30' },
    [InteractionType.FOLLOW_UP_SCHEDULED]: { icon: CalendarIcon, color: 'bg-orange-500/30' },
    [InteractionType.FOLLOW_UP_COMPLETED]: { icon: DoubleCheckIcon, color: 'bg-green-500/30' },
    [InteractionType.FOLLOW_UP_CANCELED]: { icon: XIcon, color: 'bg-red-500/30' },
    [InteractionType.FOLLOW_UP_LOST]: { icon: NoSymbolIcon, color: 'bg-rose-500/30' },
    [InteractionType.CLIENT_CREATED]: { icon: UserPlusIcon, color: 'bg-teal-500/30' },
    [InteractionType.AUDIO]: { icon: HeadsetIcon, color: 'bg-sky-500/30' },
    [InteractionType.INSECURE]: { icon: FaceFrownIcon, color: 'bg-yellow-500/30' },
};

const TimelineItem: React.FC<{ interaction: Interaction }> = ({ interaction }) => {
    const { icon: Icon, color } = iconMap[interaction.type] || { icon: MessageCircleIcon, color: 'bg-gray-500/30' };

    const [relativeTime, setRelativeTime] = useState('Agora mesmo');

    useEffect(() => {
        const updateRelativeTime = () => {
            const date = new Date(interaction.date);
            const isDateValid = !isNaN(date.getTime());
            setRelativeTime(isDateValid ? formatRelativeTime(date) : 'Agora mesmo');
        };

        updateRelativeTime(); // Set initial time

        // Update every minute to keep the relative time fresh
        const intervalId = setInterval(updateRelativeTime, 60000);

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [interaction.date]);

    const getObservationText = () => {
        const { type, observation } = interaction;
        // Check if it's a scheduled follow-up and the observation is a valid ISO date string
        if (type === InteractionType.FOLLOW_UP_SCHEDULED && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(observation)) {
            const date = new Date(observation);
            const formattedDate = date.toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            return `Follow-up agendado para ${formattedDate}`;
        }
        // For all other cases, return the observation as is
        return observation;
    };


    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} border border-white/10`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="w-px h-full bg-white/10 mt-2"></div>
            </div>
            <div className="pt-1.5 pb-2">
                <p className="text-white">
                    {getObservationText()}
                    {interaction.substituted && <span className="ml-2 text-xs font-semibold text-yellow-400">[SUBSTITUÍDO]</span>}
                </p>
                <p className="text-xs text-gray-400 mt-1">{relativeTime}</p>
            </div>
        </div>
    );
};

export default TimelineItem;