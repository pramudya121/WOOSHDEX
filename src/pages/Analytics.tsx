
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUpRight, TrendingUp, DollarSign, Activity } from 'lucide-react';

const liquidityData = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 4200 },
  { name: 'Wed', value: 3800 },
  { name: 'Thu', value: 5100 },
  { name: 'Fri', value: 4800 },
  { name: 'Sat', value: 5600 },
  { name: 'Sun', value: 6100 },
];

const volumeData = [
    { name: 'Mon', value: 1200 },
    { name: 'Tue', value: 900 },
    { name: 'Wed', value: 1600 },
    { name: 'Thu', value: 2100 },
    { name: 'Fri', value: 1800 },
    { name: 'Sat', value: 2400 },
    { name: 'Sun', value: 3200 },
];

const StatCard: React.FC<{ title: string; value: string; change: string; icon: React.ReactNode }> = ({ title, value, change, icon }) => (
    <div className="bg-woosh-card border border-woosh-surface p-6 rounded-2xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-woosh-subtext text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
            </div>
            <div className="p-2 bg-woosh-surface rounded-lg text-woosh-red">
                {icon}
            </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-green-500">
            <TrendingUp size={14} />
            <span>{change}</span>
            <span className="text-woosh-subtext ml-1">vs last week</span>
        </div>
    </div>
);

export const Analytics: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-woosh-subtext mt-1">Platform performance metrics and historical data.</p>
      </div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Total Value Locked" 
            value="$45,290.00" 
            change="+12.5%" 
            icon={<DollarSign size={20} />} 
          />
          <StatCard 
            title="Volume (24h)" 
            value="$1,240.50" 
            change="+5.2%" 
            icon={<Activity size={20} />} 
          />
          <StatCard 
            title="Total Fees Earned" 
            value="$310.12" 
            change="+8.1%" 
            icon={<ArrowUpRight size={20} />} 
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Liquidity Chart */}
        <div className="bg-woosh-card border border-woosh-surface rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Liquidity Trend</h3>
            <div className="flex gap-2">
                <span className="px-3 py-1 bg-woosh-surface rounded-full text-xs text-woosh-subtext cursor-pointer hover:text-white">1W</span>
                <span className="px-3 py-1 bg-woosh-red text-white rounded-full text-xs cursor-pointer shadow-lg shadow-woosh-red/30">1M</span>
                <span className="px-3 py-1 bg-woosh-surface rounded-full text-xs text-woosh-subtext cursor-pointer hover:text-white">1Y</span>
            </div>
            </div>
            
            <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liquidityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorLiquidity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF2D2D" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF2D2D" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2125" vertical={false} />
                <XAxis dataKey="name" stroke="#555" tick={{fill: '#555', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" tick={{fill: '#555', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#141619', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#FF2D2D' }}
                    cursor={{ stroke: '#FF2D2D', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#FF2D2D" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorLiquidity)" 
                />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* Volume Chart */}
        <div className="bg-woosh-card border border-woosh-surface rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Volume History</h3>
            </div>
            
            <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2125" vertical={false} />
                <XAxis dataKey="name" stroke="#555" tick={{fill: '#555', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" tick={{fill: '#555', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#141619', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                    cursor={{fill: '#1f2125'}}
                />
                <Bar dataKey="value" fill="#8B0000" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Top Tokens Table */}
      <div className="bg-woosh-card border border-woosh-surface rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Top Tokens</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="text-xs text-woosh-subtext uppercase border-b border-woosh-surface">
                    <tr>
                        <th className="pb-4 pl-4">Name</th>
                        <th className="pb-4 text-right">Price</th>
                        <th className="pb-4 text-right">Change (24h)</th>
                        <th className="pb-4 text-right pr-4">Volume (24h)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-woosh-surface">
                    {[
                        { name: 'USDC', symbol: 'USDC', price: '$1.00', change: '+0.01%', vol: '$1.2M' },
                        { name: 'Euro Coin', symbol: 'EURC', price: '$1.08', change: '-0.15%', vol: '$850K' },
                        { name: 'Synthra', symbol: 'SYN', price: '$5.42', change: '+12.3%', vol: '$4.1M' },
                        { name: 'Wrapped USDC', symbol: 'WUSDC', price: '$1.00', change: '0.00%', vol: '$500K' },
                    ].map((token, i) => (
                        <tr key={i} className="group hover:bg-woosh-surface/50 transition-colors">
                            <td className="py-4 pl-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-woosh-surface border border-woosh-surface flex items-center justify-center text-xs font-bold text-white">
                                    {token.symbol[0]}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{token.name}</p>
                                    <p className="text-xs text-woosh-subtext">{token.symbol}</p>
                                </div>
                            </td>
                            <td className="py-4 text-right text-white font-mono">{token.price}</td>
                            <td className={`py-4 text-right font-medium ${token.change.startsWith('+') ? 'text-green-500' : token.change.startsWith('-') ? 'text-red-500' : 'text-gray-400'}`}>
                                {token.change}
                            </td>
                            <td className="py-4 text-right pr-4 text-white font-mono">{token.vol}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
