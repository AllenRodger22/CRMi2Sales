import React from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  color: string;
  onClick?: () => void;
  isActive?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, color, onClick, isActive }) => {
  const baseClasses = "p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex flex-col justify-between h-full transition-all duration-200";
  const activeClasses = "ring-2 ring-orange-500 border-orange-400/50 scale-105";
  const hoverClasses = "hover:bg-white/10 hover:border-white/20";
  
  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : ''} ${onClick ? 'cursor-pointer ' + hoverClasses : ''}`}
      disabled={!onClick}
    >
      <h2 className="text-lg font-bold text-gray-300 text-left">{title}</h2>
      <p className={`text-3xl sm:text-4xl font-extrabold mt-2 text-left ${color}`}>{value}</p>
    </button>
  );
};

export default KpiCard;