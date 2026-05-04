import React, { useState } from 'react';
import { motion } from 'motion/react';

export function Bagua({ isReading }: { isReading?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTapped, setIsTapped] = useState(false);

  return (
    <div className="relative w-48 h-48 mx-auto cursor-pointer perspective-1000">
      <motion.svg 
        viewBox="0 0 200 200" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full drop-shadow-[0_0px_25px_rgba(168,85,247,0.7)]"
        animate={{ 
          rotate: isHovered ? 360 : [0, 360],
          scale: isTapped ? 0.9 : isHovered ? 1.05 : 1
        }}
        transition={{ 
          rotate: isHovered 
            ? { duration: 1, ease: "linear", repeat: Infinity } 
            : { duration: 15, ease: "linear", repeat: Infinity },
          scale: { duration: 0.2 }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsTapped(false);
        }}
        onMouseDown={() => setIsTapped(true)}
        onMouseUp={() => setIsTapped(false)}
        onTouchStart={() => setIsTapped(true)}
        onTouchEnd={() => setIsTapped(false)}
      >
        <defs>
          <radialGradient id="yinYangGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
          <linearGradient id="baguaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        
        {/* Outer Octagon */}
        <polygon points="60,10 140,10 190,60 190,140 140,190 60,190 10,140 10,60" fill="#1e293b" stroke="url(#baguaGrad)" strokeWidth="4" />
        <polygon points="65,15 135,15 185,65 185,135 135,185 65,185 15,135 15,65" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
        
        {/* Inner Circle */}
        <circle cx="100" cy="100" r="52" fill="#fff" stroke="url(#yinYangGrad)" strokeWidth="2" />
        
        {/* Yin Yang */}
        <path d="M 100 48 A 52 52 0 0 1 100 152 A 26 26 0 0 0 100 100 A 26 26 0 0 1 100 48 Z" fill="#1e293b" />
        <path d="M 100 48 A 52 52 0 0 0 100 152 A 26 26 0 0 0 100 100 A 26 26 0 0 1 100 48 Z" fill="#f8fafc" />
        <circle cx="100" cy="74" r="8" fill="#1e293b" />
        <circle cx="100" cy="126" r="8" fill="#f8fafc" />
        
        {/* Trigrams */}
        <g stroke="#334155" strokeWidth="5" strokeLinecap="round">
          {/* Top (Qian) - Sky */}
          <g stroke="#475569">
            <line x1="85" y1="32" x2="115" y2="32" />
            <line x1="85" y1="24" x2="115" y2="24" />
            <line x1="85" y1="16" x2="115" y2="16" />
          </g>
          
          {/* Bottom (Kun) - Earth */}
          <g stroke="#475569">
            <line x1="85" y1="168" x2="97" y2="168" /><line x1="103" y1="168" x2="115" y2="168" />
            <line x1="85" y1="176" x2="97" y2="176" /><line x1="103" y1="176" x2="115" y2="176" />
            <line x1="85" y1="184" x2="97" y2="184" /><line x1="103" y1="184" x2="115" y2="184" />
          </g>
          
          {/* Left (Li) - Fire */}
          <g stroke="#b91c1c">
            <line x1="32" y1="85" x2="32" y2="115" />
            <line x1="24" y1="85" x2="24" y2="97" /><line x1="24" y1="103" x2="24" y2="115" />
            <line x1="16" y1="85" x2="16" y2="115" />
          </g>
          
          {/* Right (Kan) - Water */}
          <g stroke="#0f172a">
            <line x1="168" y1="85" x2="168" y2="97" /><line x1="168" y1="103" x2="168" y2="115" />
            <line x1="176" y1="85" x2="176" y2="115" />
            <line x1="184" y1="85" x2="184" y2="97" /><line x1="184" y1="103" x2="184" y2="115" />
          </g>
          
          {/* Top Left (Xun) - Wind */}
          <g stroke="#475569" transform="rotate(-45 100 100)">
            <line x1="32" y1="85" x2="32" y2="115" />
            <line x1="24" y1="85" x2="24" y2="115" />
            <line x1="16" y1="85" x2="16" y2="97" /><line x1="16" y1="103" x2="16" y2="115" />
          </g>

          {/* Top Right (Dui) - Lake */}
          <g stroke="#475569" transform="rotate(45 100 100)">
            <line x1="32" y1="85" x2="32" y2="97" /><line x1="32" y1="103" x2="32" y2="115" />
            <line x1="24" y1="85" x2="24" y2="115" />
            <line x1="16" y1="85" x2="16" y2="115" />
          </g>

          {/* Bottom Left (Gen) - Mountain */}
          <g stroke="#475569" transform="rotate(-135 100 100)">
            <line x1="32" y1="85" x2="32" y2="115" />
            <line x1="24" y1="85" x2="24" y2="97" /><line x1="24" y1="103" x2="24" y2="115" />
            <line x1="16" y1="85" x2="16" y2="97" /><line x1="16" y1="103" x2="16" y2="115" />
          </g>

          {/* Bottom Right (Zhen) - Thunder */}
          <g stroke="#475569" transform="rotate(135 100 100)">
            <line x1="32" y1="85" x2="32" y2="97" /><line x1="32" y1="103" x2="32" y2="115" />
            <line x1="24" y1="85" x2="24" y2="97" /><line x1="24" y1="103" x2="24" y2="115" />
            <line x1="16" y1="85" x2="16" y2="115" />
          </g>
        </g>
      </motion.svg>
    </div>
  );
}
