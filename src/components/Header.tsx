import { Link, useLocation } from 'react-router-dom';
import { Settings, Ticket, Heart, Globe, Moon, Shield, ScrollText, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { AIOracleAnimation } from './AIOracleAnimation';

export function Header({ config }: { config?: { totalLeft: number, ipLeft: number } }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 z-50 shadow-sm flex items-center justify-between px-6 py-1">
      <div className="flex items-center gap-3">
        <Link 
          to="/" 
          className="flex items-center gap-3 transition-all relative group"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          title="返回首页"
        >
          {/* Logo with Taiji/Bagua SVG and effects */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center relative transition-all duration-1000
            ${isLogoHovered ? 'shadow-[0_0_25px_rgba(30,41,59,0.3)] rotate-[720deg]' : 'shadow-[0_0_10px_rgba(15,23,42,0.1)] rotate-0'}`}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600 opacity-20"></div>
            <svg viewBox="0 0 200 200" className="w-8 h-8 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="logoGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
              </defs>
              <polygon points="60,10 140,10 190,60 190,140 140,190 60,190 10,140 10,60" fill="url(#logoGrad)" />
              <circle cx="100" cy="100" r="50" fill="#fff" />
              <path d="M 100 50 A 50 50 0 0 1 100 150 A 25 25 0 0 0 100 100 A 25 25 0 0 1 100 50 Z" fill="#0f172a" />
              <path d="M 100 50 A 50 50 0 0 0 100 150 A 25 25 0 0 0 100 100 A 25 25 0 0 1 100 50 Z" fill="#fff" />
              <circle cx="100" cy="75" r="8" fill="#0f172a" />
              <circle cx="100" cy="125" r="8" fill="#fff" />
              {/* Decorative rings */}
              <circle cx="100" cy="100" r="90" stroke="#0f172a" strokeWidth="1" strokeOpacity="0.1" fill="none" />
            </svg>
            {isLogoHovered && (
              <div className="absolute inset-[-4px] rounded-full border border-blue-400/30 animate-pulse"></div>
            )}
            <div className={`absolute inset-[-8px] rounded-full border border-blue-500/10 transition-transform duration-1000 ${isLogoHovered ? 'scale-110' : 'scale-100'}`}></div>
          </div>
          <span className="font-serif text-slate-800 font-bold text-xl tracking-widest hidden sm:block">lifeTeller</span>
        </Link>
      </div>

      <div className="hidden md:flex flex-1 mx-4">
        <AIOracleAnimation />
      </div>

      <div className="flex items-center gap-5 text-sm text-slate-600">
        {!isAdmin && config ? (
          <>
            {/* Donate Icon */}
            <Link to="/donate" className="group relative flex items-center justify-center p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors" title="捐赠支持">
              <Heart size={20} className="group-hover:scale-110 transition-transform" fill="currentColor" />
            </Link>

            {/* Total balance icon */}
            <div className="group relative flex items-center gap-1 cursor-help" title={`全网今日剩余签位: ${config.totalLeft}`}>
              <ScrollText size={18} className="text-slate-500" />
              <span className="font-mono text-slate-700 font-bold">{config.totalLeft}</span>
            </div>

            {/* User balance icon */}
            <div className="group relative flex items-center gap-1 cursor-help" title={config.ipLeft > 0 ? `您今日剩余签位: ${config.ipLeft}` : "今日签位已用完"}>
              <UserCircle size={18} className={config.ipLeft > 0 ? "text-emerald-600" : "text-rose-500"} />
              <span className={`font-mono font-bold ${config.ipLeft > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                {config.ipLeft}
              </span>
              
              {/* Custom tooltip for empty slots */}
              {config.ipLeft === 0 && (
                <div className="absolute top-full right-0 mt-3 w-64 p-3 bg-white border border-rose-200 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-rose-700">
                  <p className="font-bold mb-1">今日签位已用完</p>
                  <p>为了防止滥用，每位访客每天有固定求签次数。您的签位将在北京时间(东八区) 0:00 重置，请明日再来！</p>
                </div>
              )}
            </div>

            {/* Admin Login Icon */}
            <Link to="/admin" className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors" title="后台登录">
              <Settings size={20} />
            </Link>
          </>
        ) : (
          <Link to="/" className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors" title="返回首页">
            <Moon size={20} />
          </Link>
        )}
      </div>
    </header>
  );
}
