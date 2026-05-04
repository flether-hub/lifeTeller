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
          // Create more complex algorithmic paths
          const amplitude = el.amplitude * 1.5;
          const freq = el.freq * 0.5;
          
          return (
            <g key={idx}>
              {/* Primary Flow Path */}
              <motion.path
                d={`M 0 60 ${Array.from({length: 10}).map((_, i) => {
                  const x = (i + 1) * 80;
                  const cy = 60 + (i % 2 === 0 ? amplitude : -amplitude);
                  return `Q ${i * 80 + 40} ${cy} ${x} 60`;
                }).join(' ')}`}
                fill="none"
                stroke={`url(#grad-${idx})`}
                strokeWidth="1.2"
                filter="url(#glow)"
                initial={{ pathOffset: 0, opacity: 0.1 }}
                animate={{ 
                  pathOffset: [0, 1],
                  opacity: [0.1, 0.4, 0.1]
                }}
                transition={{
                  duration: el.speed,
                  repeat: Infinity,
                  ease: "linear",
                  delay: el.delay
                }}
              />
              
              {/* Secondary "AI Neural" dotted path */}
              <motion.path
                d={`M 0 60 ${Array.from({length: 20}).map((_, i) => {
                  const x = (i + 1) * 40;
                  const cy = 60 + (Math.sin(i * 0.5 + idx) * amplitude * 0.4);
                  return `T ${x} 60`;
                }).join(' ')}`}
                fill="none"
                stroke={el.color}
                strokeWidth="0.5"
                strokeDasharray="2 4"
                className="opacity-20"
                animate={{ x: [0, -40] }}
                transition={{
                  duration: el.speed * 0.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </g>
          );
        })}

        {/* Floating Data Nodes - Connecting Destiny & Logic */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.g
            key={`node-${i}`}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              cx: [0, 800] 
            }}
          >
            <motion.circle
              r="1.5"
              fill="#818cf8"
              animate={{ 
                cx: [Math.random() * 800, (Math.random() * 800 + 400) % 800],
                cy: [20 + Math.random() * 80, 20 + Math.random() * 80],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.5
              }}
              className="drop-shadow-[0_0_3px_rgba(129,140,248,0.8)]"
            />
          </motion.g>
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
