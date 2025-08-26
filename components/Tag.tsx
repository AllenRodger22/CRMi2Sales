
import React from 'react';
import { ClientStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface TagProps {
  status: ClientStatus;
}

const Tag: React.FC<TagProps> = ({ status }) => {
  const colorClasses = STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${colorClasses}`}>
      {status}
    </span>
  );
};

export default Tag;
