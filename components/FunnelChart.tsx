
import React from 'react';
import { FunnelChart as RechartsFunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from 'recharts';
import { FunnelStage } from '../types';

interface FunnelChartProps {
  data: FunnelStage[];
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <RechartsFunnelChart>
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(30, 30, 40, 0.8)', 
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.75rem'
                    }} 
                />
                <Funnel
                    dataKey="count"
                    data={data}
                    isAnimationActive
                    stroke="#1f2937"
                    fill="#8b5cf6"
                >
                  <LabelList position="right" fill="#fff" stroke="none" dataKey="stage" />
                </Funnel>
            </RechartsFunnelChart>
        </ResponsiveContainer>
    </div>
  );
};

export default FunnelChart;
