import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';

interface AnimatedLogoProps {
  size?: number;
  grayscale?: boolean;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
}

export function AnimatedLogo({ size = 40, grayscale = false, className = '' }: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const triggerBurst = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent unexpected link behavior if wrapped
    // Generate a burst of stars
    const newParticles: Particle[] = [];
    const count = 15;
    const colors = grayscale 
      ? ['#94a3b8', '#64748b', '#cbd5e1', '#f1f5f9'] 
      : ['#fcd34d', '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa'];

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random(),
        x: 0,
        y: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        angle: Math.random() * Math.PI * 2,
        velocity: Math.random() * 8 + 4,
      });
    }
    setParticles(prev => [...prev, ...newParticles].slice(-50)); // Keep pool manageable
    
    // Auto-clean after 1s
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1200);
  }, [grayscale]);

  return (
    <div 
      className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={triggerBurst}
    >
      <motion.div
        animate={{ 
          rotate: isHovered ? 720 : 0,
          scale: isHovered ? 1.05 : 1
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className={`rounded-full flex items-center justify-center relative shadow-sm overflow-visible
          ${grayscale ? 'bg-slate-100' : 'bg-slate-50'}`}
        style={{ width: size, height: size }}
      >
        {/* Mirroring SVG from Header but with dynamic colors */}
        <svg viewBox="0 0 100 100" className="w-[90%] h-[90%]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#fff" />
          <path 
            d="M 50 0 A 50 50 0 0 1 50 100 A 25 25 0 0 0 50 50 A 25 25 0 0 1 50 0 Z" 
            fill={grayscale ? '#64748b' : '#0f172a'} 
          />
          <path 
            d="M 50 0 A 50 50 0 0 0 50 100 A 25 25 0 0 0 50 50 A 25 25 0 0 1 50 0 Z" 
            fill={grayscale ? '#f1f5f9' : '#fff'} 
            stroke={grayscale ? '#94a3b8' : '#0f172a'} 
            strokeWidth="0.5" 
          />
          <circle cx="50" cy="25" r="8" fill={grayscale ? '#64748b' : '#0f172a'} />
          <circle cx="50" cy="75" r="8" fill={grayscale ? '#f1f5f9' : '#fff'} />
        </svg>

        {/* Outer Glow Effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute inset-[-4px] rounded-full border border-blue-400/30 animate-pulse`}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Particles Container */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
            animate={{ 
              x: Math.cos(p.angle) * p.velocity * 20,
              y: Math.sin(p.angle) * p.velocity * 20,
              scale: 0,
              opacity: 0,
              rotate: 360
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 -ml-2 -mt-2"
          >
            <Star size={p.size} fill={p.color} className="text-white" style={{ color: p.color }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
