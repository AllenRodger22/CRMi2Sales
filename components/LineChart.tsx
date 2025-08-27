import React, { useState } from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyPoint } from '../types';

interface LineChartProps {
  data: DailyPoint[];
}

const lineSeries = [
    { dataKey: "ligacoes", name: "Ligações", stroke: "#f97316" },
    { dataKey: "ce", name: "Contatos Efetivos", stroke: "#38bdf8" },
    { dataKey: "tratativas", name: "Tratativas", stroke: "#facc15" },
    { dataKey: "documentacao", name: "Documentação", stroke: "#fb923c" },
    { dataKey: "vendas", name: "Vendas", stroke: "#4ade80" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 bg-gray-900/80 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg">
          <p className="label text-white font-bold mb-2">{`Data: ${label}`}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }} className="text-sm">
              {`${pld.name}: ${pld.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
};

const LineChart: React.FC<LineChartProps> = ({ data }) => {
    const [visibility, setVisibility] = useState(() => {
        const initialState: Record<string, boolean> = {};
        lineSeries.forEach(s => {
            initialState[s.dataKey] = true;
        });
        return initialState;
    });
    
    const handleLegendClick = (e: { dataKey?: any }) => {
        if (e.dataKey) {
            setVisibility(prev => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));
        }
    };

    const legendFormatter = (value: string, entry: any) => {
        const { dataKey } = entry;
        const isHidden = !visibility[dataKey];
        return <span style={{ color: isHidden ? '#6b7280' : '#d1d5db' }}>{value}</span>;
    };

    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <RechartsLineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af" 
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        interval="preserveStartEnd"
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                        content={<CustomTooltip />}
                        wrapperStyle={{ outline: 'none' }}
                    />
                    <Legend 
                        wrapperStyle={{ color: '#d1d5db', paddingTop: '20px', cursor: 'pointer' }} 
                        onClick={handleLegendClick}
                        formatter={legendFormatter}
                    />
                    {lineSeries.map(series => (
                        <Line 
                            key={series.dataKey}
                            type="monotone" 
                            dataKey={series.dataKey}
                            name={series.name}
                            stroke={series.stroke}
                            strokeWidth={2}
                            hide={!visibility[series.dataKey]}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </RechartsLineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LineChart;