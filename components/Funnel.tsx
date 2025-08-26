import React, { useMemo } from 'react';
import { FunnelAnalyticsData, FunnelStage } from '../types';

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const FUNNEL_COLORS = [
  'bg-red-500',    // Ligações
  'bg-orange-500', // CE
  'bg-yellow-400', // Tratativa
  'bg-lime-500',   // Documentação Completa
  'bg-green-500',  // Vendas
];

// The correct, expected stages for the funnel, in order.
const CORRECT_FUNNEL_STAGES = [
  'Ligações',
  'Contatos Efetivos (CE)',
  'Tratativa',
  'Documentação Completa',
  'Vendas',
];

// Calculates relative conversion rates: next / current
const calcConversionRates = (funnel: FunnelStage[]) => {
  const rates: number[] = [];
  for (let i = 0; i < funnel.length - 1; i++) {
    const curr = funnel[i].count;
    const next = funnel[i + 1].count;
    rates.push(curr > 0 ? next / curr : 0);
  }
  return rates;
};

const Funnel: React.FC<{ data: FunnelAnalyticsData }> = ({ data }) => {
  
  const sanitizedFunnel = useMemo(() => {
    if (!data?.funnel?.length) {
      return [];
    }

    // 1. Create a new funnel structure with the correct stage names.
    // We assume the order of the incoming data corresponds to our desired funnel.
    const newFunnel: FunnelStage[] = CORRECT_FUNNEL_STAGES.map((stageName, index) => ({
      stage: stageName,
      // Use the count from the API if it exists, otherwise default to 0.
      count: data.funnel[index]?.count ?? 0,
    }));
    
    // 2. Sanitize the counts to ensure they are monotonically decreasing.
    // This prevents illogical conversion rates > 100%.
    for (let i = 1; i < newFunnel.length; i++) {
      if (newFunnel[i].count > newFunnel[i-1].count) {
        // If a step is larger than the previous one, cap it at the previous step's value.
        newFunnel[i].count = newFunnel[i-1].count;
      }
    }
    
    return newFunnel;

  }, [data.funnel]);

  const conversionRates = useMemo(() => calcConversionRates(sanitizedFunnel), [sanitizedFunnel]);

  // Handle case where there's no data to display.
  if (sanitizedFunnel.length === 0) {
    return <div className="text-gray-400">Dados do funil indisponíveis.</div>;
  }

  return (
    <div className="space-y-1 flex flex-col items-center">
      {sanitizedFunnel.map((stage, index) => {
        const widthPercentage = 100 - index * 5;
        const color = FUNNEL_COLORS[index] || 'bg-gray-500';

        return (
          <React.Fragment key={stage.stage}>
            {/* Bar */}
            <div
              className={`${color} rounded-md px-4 py-2 flex justify-between items-center text-white shadow-lg border border-white/10 transition-all duration-300 w-full`}
              title={`${stage.count} em "${stage.stage}"`}
              style={{ width: `${widthPercentage}%` }}
            >
              <span className="font-bold text-sm truncate">{stage.stage}</span>
              <span className="font-extrabold text-lg ml-4">{stage.count}</span>
            </div>

            {/* Relative % */}
            {index < sanitizedFunnel.length - 1 && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 py-0.5">
                <ChevronDownIcon className="w-4 h-4" />
                <span>{(conversionRates[index] * 100).toFixed(1)}%</span>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Funnel;