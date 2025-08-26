import React from 'react';
import { BreakdownItem } from '../types';

interface BreakdownTableProps {
  data: BreakdownItem[];
  headers: string[];
  dataKeys: string[];
}

const BreakdownTable: React.FC<BreakdownTableProps> = ({ data, headers, dataKeys }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-400">Nenhum dado disponível.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="border-b border-white/20">
          <tr>
            {headers.map(header => (
              <th key={header} className="p-4 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
              {dataKeys.map((key, cellIndex) => (
                <td key={key} className={`p-4 ${cellIndex === 0 ? 'font-medium text-white' : ''}`}>
                  {item[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BreakdownTable;
