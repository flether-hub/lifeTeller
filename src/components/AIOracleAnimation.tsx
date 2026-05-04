import React from 'react';
import { motion } from 'motion/react';

export function AIOracleAnimation() {
  const elements = [
    { name: '金', color: 'rgba(255, 215, 0, 0.2)', amplitude: 10, freq: 0.02, speed: 12, delay: 0 },
    { name: '木', color: 'rgba(74, 222, 128, 0.2)', amplitude: 14, freq: 0.015, speed: 18, delay: 2 },
    { name: '水', color: 'rgba(96, 165, 250, 0.2)', amplitude: 18, freq: 0.01, speed: 15, delay: 1 },
    { name: '火', color: 'rgba(248, 113, 113, 0.2)', amplitude: 12, freq: 0.025, speed: 10, delay: 3 },
    { name: '土', color: 'rgba(251, 191, 36, 0.2)', amplitude: 9, freq: 0.03, speed: 20, delay: 4 },
  ];

  return (
    <div className="flex-1 flex items-center justify-center h-8 overflow-hidden relative group w-full min-w-[300px]">
      {/* Background Pulse Glow - Very subtle */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent opacity-20 pointer-events-none" />
      
      <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="h-full w-full relative z-10">
        <defs>
          {elements.map((el, i) => (
            <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={el.color.replace('0.2', '0')} />
              <stop offset="50%" stopColor={el.color.replace('0.2', '0.5')} />
              <stop offset="100%" stopColor={el.color.replace('0.2', '0')} />
            </linearGradient>
          ))}
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {elements.map((el, idx) => {
          const amplitude = el.amplitude * 1.8;
          const h = 60;
          
          // Generate paths for three phases of movement
          const getD = (phase: number) => {
            const pts = [
              { x: 0, y: h },
              { x: 200, y: h + Math.sin(phase + idx) * amplitude },
              { x: 400, y: h + Math.sin(phase + idx + 1) * amplitude },
              { x: 600, y: h + Math.sin(phase + idx + 2) * amplitude },
              { x: 800, y: h }
            ];
            return `M 0 ${h} Q 100 ${pts[1].y} 200 ${h} Q 300 ${pts[2].y} 400 ${h} Q 500 ${pts[3].y} 600 ${h} Q 700 ${h + Math.sin(phase + idx + 3) * amplitude} 800 ${h}`;
          };

          return (
            <g key={idx}>
              <motion.path
                d={getD(0)}
                fill="none"
                stroke={`url(#grad-${idx})`}
                strokeWidth="2.5"
                animate={{ 
                  d: [getD(0), getD(Math.PI), getD(Math.PI * 2)],
                  opacity: [0.1, 0.4, 0.1]
                }}
                transition={{
                  duration: el.speed * 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: el.delay * 0.5
                }}
              />
              
              <motion.path
                d={getD(0.5)}
                fill="none"
                stroke={el.color}
                strokeWidth="1"
                className="opacity-20"
                animate={{ 
                  d: [getD(0.5), getD(Math.PI + 0.5), getD(Math.PI * 2 + 0.5)],
                }}
                transition={{
                  duration: el.speed,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: el.delay * 0.5 + 0.2
                }}
              />
            </g>
          );
        })}

        {/* Floating Data Nodes - Connecting Destiny & Logic */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.circle
            key={`node-${i}`}
            r="1.5"
            fill="#818cf8"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              cx: [(i * 60) % 800, ((i * 60) + 400) % 800],
              cy: [20 + ((i * 10) % 80), 30 + ((i * 15) % 80)],
              scale: [0.5, 1.2, 0.5]
            }}
            transition={{
              duration: 10 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
            className="drop-shadow-[0_0_3px_rgba(129,140,248,0.8)]"
          />
        ))}
      </svg>

      {/* Center "Oracle Core" Indicator - Super delicate */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
      </div>

      {/* Floating Trigrams - Background Texture */}
      <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-5 px-12">
        {['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'].map((t, i) => (
          <motion.span 
            key={i}
            className="text-xl font-serif text-indigo-900"
            animate={{ 
              y: [0, -5, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
          >
            {t}
          </motion.span>
        ))}
      </div>

      {/* Overlay Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
    </div>
  );
}
