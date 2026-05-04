import React from 'react';

export function CrystalBall({ isReading }: { isReading: boolean }) {
  return (
    <div className={`relative w-48 h-48 mx-auto ${isReading ? 'crystal-ball-glow float' : 'opacity-80'}`}>
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <radialGradient id="ballGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#a78bfa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.8" />
          </radialGradient>
          <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Shadow */}
        <ellipse cx="100" cy="180" rx="60" ry="10" fill="url(#shadowGrad)" />
        
        {/* Base */}
        <path d="M 70 160 L 130 160 L 140 180 L 60 180 Z" fill="#1e1b4b" stroke="#312e81" strokeWidth="2" />
        <path d="M 60 180 L 140 180 L 150 190 L 50 190 Z" fill="#312e81" />
        
        {/* Ball */}
        <circle cx="100" cy="90" r="70" fill="url(#ballGrad)" />
        
        {/* Highlights */}
        <ellipse cx="70" cy="50" rx="20" ry="10" fill="#fff" opacity="0.4" transform="rotate(-30 70 50)" />
        <ellipse cx="130" cy="130" rx="10" ry="5" fill="#fff" opacity="0.2" transform="rotate(-30 130 130)" />
        
        {/* Inner magic (only visible when reading) */}
        {isReading && (
          <g className="animate-spin" style={{ transformOrigin: '100px 90px', animationDuration: '4s' }}>
            <circle cx="100" cy="60" r="3" fill="#fff" opacity="0.8" />
            <circle cx="130" cy="90" r="4" fill="#fff" opacity="0.6" />
            <circle cx="70" cy="110" r="2" fill="#fff" opacity="0.9" />
            <circle cx="110" cy="120" r="3" fill="#fff" opacity="0.7" />
          </g>
        )}
      </svg>
    </div>
  );
}
