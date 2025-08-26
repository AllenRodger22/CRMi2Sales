import React, { useState } from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyPoint } from '../types';

interface LineChartProps {
  data: DailyPoint[];
}

// Define the series configuration in one place for easier management
const lineSeries = [
    { dataKey: "ligacoes", name: "Ligações", stroke: "#f97316" },
    { dataKey: "ce", name: "Contatos Efetivos", stroke: "#38bdf8" },
    { dataKey: "tratativas", name: "Tratativas", stroke: "#facc15" },
    { dataKey: "documentacao", name: "Documentação", stroke: "#fb923c" },
    { dataKey: "vendas", name: "Vendas", stroke: "#4ade80" },
];

const LineChart: React.FC<LineChartProps> = ({ data }) => {
    // State to manage the visibility of each line series
    const [visibility, setVisibility] = useState(() => {
        const initialState: Record<string, boolean> = {};
        lineSeries.forEach(s => {
            initialState[s.dataKey] = true;
        });
        return initialState;
    });
    
    // Toggles the visibility of a series when its legend item is clicked
    // FIX: The type from Recharts for the legend payload has `dataKey` as an optional property,
    // which caused a type mismatch. The handler's parameter type is now corrected to make
    // `dataKey` optional, and a guard is added to handle cases where it might be missing.
    const handleLegendClick = (e: { dataKey?: any }) => {
        if (e.dataKey) {
            setVisibility(prev => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));
        }
    };

    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <RechartsLineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(30, 30, 40, 0.8)', 
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.75rem'
                        }}
                    />
                    <Legend 
                        wrapperStyle={{ color: '#d1d5db', paddingTop: '20px', cursor: 'pointer' }} 
                        onClick={handleLegendClick} // Enable clicking on legend items
                    />
                    {lineSeries.map(series => (
                        <Line 
                            key={series.dataKey}
                            type="monotone" 
                            dataKey={series.dataKey}
                            name={series.name}
                            stroke={series.stroke}
                            strokeWidth={2}
                            hide={!visibility[series.dataKey]} // Hide line based on state
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