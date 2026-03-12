import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export const PortfolioGrowthChart = ({ investments }) => {
  // Generate mock past 5 days of growth based on total current value
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  
  const mockDataPoints = [
      totalValue * 0.92,
      totalValue * 0.94,
      totalValue * 0.98,
      totalValue * 1.05,
      totalValue
  ].map(val => Math.round(val));

  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        fill: true,
        label: 'Portfolio Value (₹)',
        data: mockDataPoints,
        borderColor: '#6366f1', // indigo-500
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#6366f1',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 14, weight: 'bold' },
        callbacks: {
           label: (context) => `₹${context.parsed.y.toLocaleString()}`
        }
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f1f5f9' }, min: Math.min(...mockDataPoints) * 0.9 }
    },
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
         <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
           <TrendingUp size={20} />
         </div>
         <h3 className="text-lg font-bold text-slate-800">Portfolio Growth</h3>
      </div>
      <div className="h-64 w-full">
        <Line options={options} data={data} />
      </div>
    </div>
  );
};

export const InvestmentAllocationChart = ({ investments }) => {
  // Group by type
  const typeMap = investments.reduce((acc, inv) => {
    acc[inv.type] = (acc[inv.type] || 0) + inv.investedAmount;
    return acc;
  }, {});

  const labels = Object.keys(typeMap);
  const dataValues = Object.values(typeMap);

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: [
          '#6366f1', // indigo
          '#10b981', // emerald
          '#f59e0b', // amber
          '#8b5cf6', // violet
          '#ec4899', // pink
        ],
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  };

  const options = {
     responsive: true,
     maintainAspectRatio: false,
     plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
        tooltip: {
           callbacks: {
              label: (context) => ` ₹${context.parsed.toLocaleString()}`
           }
        }
     },
     cutout: '70%'
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
       <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
         <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
           <PieChartIcon size={20} />
         </div>
         <h3 className="text-lg font-bold text-slate-800">Asset Allocation</h3>
      </div>
      <div className="flex-1 min-h-[250px] w-full relative">
        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none pb-8">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
           <span className="text-xl font-extrabold text-slate-800">
             ₹{dataValues.reduce((a, b) => a + b, 0).toLocaleString()}
           </span>
        </div>
        <Pie options={options} data={data} />
      </div>
    </div>
  );
};
