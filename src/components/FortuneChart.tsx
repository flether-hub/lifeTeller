import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function FortuneChart({ decades, birthDate }: { decades: any[], birthDate?: string }) {
  if (!decades || !Array.isArray(decades) || decades.length === 0) return null;

  // Generate yearly data using cosine interpolation
  const yearlyData = useMemo(() => {
    const parseRange = (rangeStr: string) => {
      const match = rangeStr.match(/(\d+)-(\d+)岁/);
      if (match) {
        return { start: parseInt(match[1]), end: parseInt(match[2]) };
      }
      return { start: 0, end: 10 };
    };

    const points = decades.map(d => {
      const { start, end } = parseRange(d.ageRange);
      return {
        age: Math.floor((start + end) / 2),
        career: Number(d.career) || 50,
        wealth: Number(d.wealth) || 50,
        family: Number(d.family) || 50,
        health: Number(d.health) || 50
      };
    }).sort((a, b) => a.age - b.age);

    const getInterpolatedValue = (age: number, key: 'career' | 'wealth' | 'family' | 'health') => {
      if (points.length === 0) return 50;
      if (points.length === 1) return points[0][key];
      
      // If age is outside existing points, use the nearest boundary point
      if (age <= points[0].age) return points[0][key];
      if (age >= points[points.length - 1].age) return points[points.length - 1][key];
      
      // Binary search or simple find for the interval
      for (let i = 0; i < points.length - 1; i++) {
        if (age >= points[i].age && age <= points[i+1].age) {
          const p1 = points[i];
          const p2 = points[i+1];
          const ratio = (age - p1.age) / (p2.age - p1.age);
          // Smoother cosine interpolation for the "lifeline" look
          const smoothRatio = (1 - Math.cos(ratio * Math.PI)) / 2;
          return Math.round(p1[key] + (p2[key] - p1[key]) * smoothRatio);
        }
      }
      return 50;
    };

    const result = [];
    // Always show up to 100 years, ensuring starting and ending points are well-defined
    for (let age = 0; age <= 100; age++) {
      result.push({
        ageValue: age,
        career: getInterpolatedValue(age, 'career'),
        wealth: getInterpolatedValue(age, 'wealth'),
        family: getInterpolatedValue(age, 'family'),
        health: getInterpolatedValue(age, 'health')
      });
    }
    return result;
  }, [decades]);

  const xTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <div className="w-full h-[400px] sm:h-[450px] mt-8 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.02)] pb-4 sm:pb-8 relative overflow-hidden">
      {/* Background AI Motif */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex items-center justify-center overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 800 400" className="scale-150">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-900" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path d="M0 200 Q200 100 400 200 T800 200" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-indigo-500" />
          <path d="M0 220 Q200 320 400 220 T800 220" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-indigo-400" />
        </svg>
      </div>

      <div className="flex justify-between items-center mb-4 sm:mb-6 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
          <h3 className="text-slate-800 font-serif text-lg sm:text-xl font-bold m-0 tracking-widest">一生天命走势图</h3>
        </div>
        <div className="px-2 sm:px-3 py-1 bg-indigo-50 rounded-full text-[9px] sm:text-[10px] text-indigo-600 font-bold uppercase tracking-widest border border-indigo-100 flex-none ml-2">
          AI T-REND
        </div>
      </div>
      
      <p className="text-xs text-slate-400 mb-4 sm:mb-8 text-left sm:text-center relative z-10 font-light shrink-0">
        <span className="inline-block w-2 h-2 rounded-full bg-indigo-400/20 mr-1 animate-pulse" />
        交互式解析：沿曲线滑动查看各流年维度的命理详细评分
      </p>

      <div className="relative flex-1 w-full z-10 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={yearlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCareer" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFamily" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="ageValue" 
              type="number"
              domain={[0, 100]}
              ticks={xTicks}
              stroke="#cbd5e1" 
              tick={{fontSize: 10, fill: '#64748b'}}
              tickFormatter={(val) => `${val}岁`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#cbd5e1" 
              tick={{fontSize: 10, fill: '#64748b'}} 
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={true} horizontal={true} />
            <Tooltip 
               cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
               contentStyle={{ 
                 backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                 borderColor: '#e2e8f0', 
                 borderRadius: '16px', 
                 boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                 border: '1px solid #f1f5f9',
                 padding: '12px'
               }}
               labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}
               itemStyle={{ fontSize: '12px', padding: '2px 0' }}
               formatter={(value: any) => [`${value}分`, '']}
               labelFormatter={(label: any) => `${label}岁 运势推演`}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: '30px', fontSize: '12px', color: '#64748b' }}
            />
            <Area 
              type="monotone" 
              name="事业" 
              dataKey="career" 
              stroke="#3b82f6" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#colorCareer)" 
              isAnimationActive={true}
              animationDuration={2000}
            />
            <Area 
              type="monotone" 
              name="财富" 
              dataKey="wealth" 
              stroke="#f59e0b" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#colorWealth)" 
              isAnimationActive={true}
              animationDuration={2000}
            />
            <Area 
              type="monotone" 
              name="感情" 
              dataKey="family" 
              stroke="#ec4899" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#colorFamily)" 
              isAnimationActive={true}
              animationDuration={2000}
            />
            <Area 
              type="monotone" 
              name="健康" 
              dataKey="health" 
              stroke="#10b981" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#colorHealth)" 
              isAnimationActive={true}
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
