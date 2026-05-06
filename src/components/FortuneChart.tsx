import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../context/LanguageContext';

export function FortuneChart({ decades, birthDate }: { decades: any[], birthDate?: string }) {
  const { t } = useLanguage();
  if (!decades || !Array.isArray(decades) || decades.length === 0) return null;

  // Generate yearly data using cosine interpolation
  const yearlyData = useMemo(() => {
    const parseRange = (rangeStr: string) => {
      // Handle both Simplified (岁) and Traditional (歲) characters, and various separators (-, ~, 至)
      const match = String(rangeStr).match(/(\d+)\s*[-~至]\s*(\d+)\s*[岁歲]?/);
      if (match) {
        return { start: parseInt(match[1]), end: parseInt(match[2]) };
      }
      // Fallback for simple single numbers or other formats
      const singleMatch = String(rangeStr).match(/(\d+)/g);
      if (singleMatch && singleMatch.length >= 2) {
        return { start: parseInt(singleMatch[0]), end: parseInt(singleMatch[1]) };
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
    <div className="w-full h-[450px] mt-4 flex flex-col relative overflow-hidden">
      <div className="absolute top-2 right-2 flex items-center gap-4 text-[11px] font-medium z-20 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-100/50 shadow-sm print:hidden">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-blue-600">{t("事业")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-emerald-600">{t("健康")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-pink-500" />
          <span className="text-pink-600">{t("感情")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-orange-600">{t("财富")}</span>
        </div>
      </div>

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
              tickFormatter={(val) => `${val}${t("岁")}`}
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
               formatter={(value: any) => [`${value}${t("分")}`, '']}
               labelFormatter={(label: any) => `${label}${t("岁")} ${t("运势推演")}`}
            />
            <Area 
              type="monotone" 
              name={t("事业")} 
              dataKey="career" 
              stroke="#3b82f6" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#colorCareer)" 
              isAnimationActive={true}
              animationDuration={2000}
              legendType="none"
            />
            <Area 
              type="monotone" 
              name={t("财富")} 
              dataKey="wealth" 
              stroke="#f59e0b" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#colorWealth)" 
              isAnimationActive={true}
              animationDuration={2000}
              legendType="none"
            />
            <Area 
              type="monotone" 
              name={t("感情")} 
              dataKey="family" 
              stroke="#ec4899" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#colorFamily)" 
              isAnimationActive={true}
              animationDuration={2000}
              legendType="none"
            />
            <Area 
              type="monotone" 
              name={t("健康")} 
              dataKey="health" 
              stroke="#10b981" 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill="url(#colorHealth)" 
              isAnimationActive={true}
              animationDuration={2000}
              legendType="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
