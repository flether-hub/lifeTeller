import React from "react";
import { FortuneChart } from "./FortuneChart";
import {
  Bot,
  LibraryBig,
  Quote,
  CalendarDays,
  Compass,
  TrendingUp,
  Briefcase,
  Coins,
  Heart,
  History,
  Activity,
  BookOpen,
  Clock,
  MapPin,
  Sparkles,
  Flame,
  Leaf,
  Mountain,
  Diamond,
  Waves,
} from "lucide-react";

function LuckyVisual({
  numbers,
  colors,
}: {
  numbers?: string;
  colors?: string;
}) {
  if (!numbers && !colors) return null;

  const parseWuXing = (text: string) => {
    const t = text || "";
    if (t.includes("木"))
      return {
        icon: <Leaf size={20} className="text-emerald-600" />,
        label: "木",
      };
    if (t.includes("火"))
      return {
        icon: <Flame size={20} className="text-orange-600" />,
        label: "火",
      };
    if (t.includes("土"))
      return {
        icon: <Mountain size={20} className="text-amber-700" />,
        label: "土",
      };
    if (t.includes("金"))
      return {
        icon: <Diamond size={20} className="text-blue-600" />,
        label: "金",
      };
    if (t.includes("水"))
      return {
        icon: <Waves size={20} className="text-sky-600" />,
        label: "水",
      };
    return {
      icon: <Sparkles size={20} className="text-indigo-600" />,
      label: "吉",
    };
  };

  const getColorBgStyle = (colorName: string) => {
    const name = colorName || "";
    if (name.includes("红")) return "bg-red-50 text-red-600 border-red-100";
    if (name.includes("紫")) return "bg-purple-50 text-purple-600 border-purple-100";
    if (name.includes("粉")) return "bg-pink-50 text-pink-600 border-pink-100";
    if (name.includes("蓝")) return "bg-blue-50 text-blue-600 border-blue-100";
    if (name.includes("黑")) return "bg-slate-900 text-white border-slate-900";
    if (name.includes("银")) return "bg-slate-100 text-slate-600 border-slate-200";
    if (name.includes("白")) return "bg-white text-slate-400 border-slate-200";
    if (name.includes("米")) return "bg-stone-100 text-stone-600 border-stone-200";
    if (name.includes("金")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (name.includes("黄")) return "bg-yellow-50 text-yellow-600 border-yellow-100";
    if (name.includes("青") || name.includes("绿") || name.includes("翠")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (name.includes("橙")) return "bg-orange-50 text-orange-600 border-orange-100";
    if (name.includes("灰")) return "bg-gray-100 text-gray-600 border-gray-200";
    if (name.includes("棕") || name.includes("褐") || name.includes("咖")) return "bg-[#8B4513]/10 text-[#8B4513] border-[#8B4513]/20";
    return "bg-slate-50 text-slate-700 border-slate-100";
  };

  const parseLuckyNumbers = (text: string) => {
    if (!text || typeof text !== 'string') return [];
    
    const results: { tag: string; nums: string[] }[] = [];
    let currentNums: string[] = [];
    let currentTag = "";
    
    // First try sophisticated split by elements
    const parts = text.split(/([金木水火土])/);
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        
        if (["金", "木", "水", "火", "土"].includes(part)) {
            if (currentNums.length > 0) {
                results.push({ tag: currentTag, nums: Array.from(new Set(currentNums)) });
                currentNums = [];
            }
            currentTag = part;
        } else {
            const nums = part.match(/\d+/g) || [];
            if (nums.length > 0) {
                currentNums.push(...nums);
            }
        }
    }
    
    if (currentNums.length > 0) {
        results.push({ tag: currentTag, nums: Array.from(new Set(currentNums)) });
    }
    
    // If no numbers were found after tagging logic, try extraction from whole string
    if (results.length === 0 || results.every(r => r.nums.length === 0)) {
        const allDigits = text.match(/\d+/g);
        if (allDigits && allDigits.length > 0) {
            return [{ tag: "吉", nums: Array.from(new Set(allDigits)) }];
        }
    }

    return results.filter(r => r.nums.length > 0);
  };

  const luckyStats = parseWuXing((numbers || "") + " " + (colors || ""));
  const parsedNumbers = parseLuckyNumbers(numbers || "");

  return (
    <div className="flex flex-col gap-6 py-2">
      {numbers && (
        <div className="text-left">
          <div className="flex items-center gap-2 mb-2 border-l-2 border-slate-100 pl-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">五行吉数</span>
          </div>
          <div className="flex flex-wrap gap-4 pl-4">
            {parsedNumbers.map((group, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-3">
                {group.nums.map((n, i) => (
                  <span
                    key={i}
                    className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-xl font-bold font-sans text-slate-700 leading-none shadow-sm bg-white"
                  >
                    {n}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {colors && (
        <div className="text-left">
          <div className="flex items-center gap-2 mb-2 border-l-2 border-slate-100 pl-3">
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">生旺颜色</span>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-2 pl-4">
            {colors
              .split(/[、\s，,;；]+/)
              .filter((c) => c.trim())
              .map((c, i) => {
                const colorName = c.split(/[（(]/)[0].trim();
                if (!colorName || colorName.length > 10) return null;
                return (
                  <div
                    key={i}
                    className={`px-3 py-1 text-sm font-bold font-sans rounded-md border ${getColorBgStyle(colorName)} shadow-sm`}
                  >
                    {colorName}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function YinYangIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width="1em"
      height="1em"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="white"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M50 2 A 48 48 0 0 1 50 98 A 24 24 0 0 0 50 50 A 24 24 0 0 1 50 2"
        fill="currentColor"
      />
      <circle cx="50" cy="26" r="6" fill="currentColor" />
      <circle cx="50" cy="74" r="6" fill="white" />
    </svg>
  );
}

function BaZiVisual({ bazi }: { bazi: any[] }) {
  if (!bazi || !Array.isArray(bazi) || bazi.length === 0) return null;

  return (
    <div className="flex justify-center py-6">
      <div className="flex gap-6">
        {/* Traditional reading: Hour, Day, Month, Year */}
        {bazi.map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-medium text-slate-300 tracking-widest uppercase">{b.pillar}</span>
            <div className="flex flex-col border border-slate-100 rounded-sm overflow-hidden bg-white">
              <div className="w-12 h-12 flex items-center justify-center text-xl font-serif font-bold text-slate-800 border-b border-slate-50">
                {b.gan}
              </div>
              <div className="w-12 h-12 flex items-center justify-center text-xl font-serif font-bold text-slate-800">
                {b.zhi}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-serif opacity-70">{b.wuXing}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FortuneResultView(props: {
  result: any;
  userInfo?: {
    name: string;
    gender: string;
    date: string;
    time: string;
    province: string;
    calendarType: string;
  };
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  const [contentHeight, setContentHeight] = React.useState(0);
  const innerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleResize = () => {
      const baseWidth = 794; // Standard A4 width at 96 DPI
      const windowWidth = window.innerWidth;
      const padding = windowWidth < 640 ? 48 : 64; // Increased padding for mobile
      
      if (windowWidth < baseWidth + padding) {
        const s = (windowWidth - padding) / baseWidth;
        setScale(Math.max(0.3, s));
      } else {
        setScale(1);
      }

      if (innerRef.current) {
        setContentHeight(innerRef.current.offsetHeight);
      }
    };
    
    handleResize();
    const timer = setTimeout(handleResize, 300);
    window.addEventListener("resize", handleResize);
    
    // Observer for height changes
    const observer = new ResizeObserver(() => {
      if (innerRef.current) {
        setContentHeight(innerRef.current.offsetHeight);
      }
    });
    if (innerRef.current) observer.observe(innerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      className="w-full bg-slate-100/30 flex justify-center overflow-hidden py-4 md:py-10 px-0 print:p-0 print:bg-white"
      style={{ height: scale !== 1 ? `${contentHeight * scale}px` : "auto" }}
    >
      <div
        ref={containerRef}
        className="shrink-0 origin-top transition-all duration-300 bg-white shadow-xl print:shadow-none"
        style={{
          width: "794px", 
          transform: scale !== 1 ? `scale(${scale})` : "none",
          height: "fit-content",
          marginInline: "auto",
        }}
        id="fortune-result-content"
      >
        <div ref={innerRef}>
          <FortuneResultViewInner {...props} />
        </div>
      </div>
    </div>
  );
}

function FortuneResultViewInner({
  result,
  userInfo,
}: {
  result: any;
  userInfo?: {
    name: string;
    gender: string;
    date: string;
    time: string;
    province: string;
    calendarType: string;
  };
}) {
  if (!result) return null;

  const match = userInfo?.date?.match(/^(\d{4})/);
  let currentDecadeIndex = -1;
  if (match) {
    const birthYear = parseInt(match[1]);
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthYear;
    currentDecadeIndex = Math.floor(currentAge / 10);
    if (currentDecadeIndex > 9) currentDecadeIndex = 9;
    if (currentDecadeIndex < 0) currentDecadeIndex = 0;
  }

  const sanitizeContent = (text: string) => {
    if (!text || typeof text !== 'string') return "";
    return text.trim().replace(/\n{3,}/g, "\n\n");
  };

  return (
    <div className="w-full bg-white font-sans text-slate-800 px-4 sm:px-6 md:px-12 py-8 md:py-16 relative overflow-hidden">
      {/* Decorative Background */}
      <svg className="absolute inset-0 w-full h-full -z-10 opacity-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Decorative Border removed */}
      
      <div className="relative text-center mb-10 pb-8 border-b border-indigo-100">
        <div className="flex justify-center items-center gap-4 mb-2">
          <Bot className="w-8 h-8 text-indigo-900" />
          <h1 className="text-3xl font-serif font-bold tracking-[0.2em] text-indigo-950">命理玄鉴</h1>
          <YinYangIcon className="w-8 h-8 text-indigo-900" />
        </div>
        <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mx-auto rounded-full mt-4" />

        {userInfo && (
          <div className="mt-8 flex justify-center gap-10 text-xs text-indigo-800 font-serif">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase text-indigo-400 tracking-widest mb-1">缘主</span>
              <span className="font-bold text-indigo-950 text-sm">{userInfo.name}（{userInfo.gender}）</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase text-indigo-400 tracking-widest mb-1">生辰</span>
              <span className="font-bold text-indigo-950 text-sm">{userInfo.calendarType} {userInfo.date} {userInfo.time}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase text-indigo-400 tracking-widest mb-1">出生地</span>
              <span className="font-bold text-indigo-950 text-sm">{userInfo.province}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-12 flex items-center justify-center gap-10 border-b border-slate-50 pb-8 break-inside-avoid">
        <BaZiVisual bazi={result.bazi} />
        <div className="w-auto min-w-[200px] border-l border-slate-50 pl-10">
          <LuckyVisual numbers={result.luckyNumbers} colors={result.luckyColors} />
        </div>
      </div>

      <div className="space-y-10">
        {result.nameLocationAnalysis && (
          <Section title="姓名与方位渊源" icon={<MapPin className="w-5 h-5" />}>
            <p className="text-[14px] leading-[1.8] text-slate-600 whitespace-pre-line text-justify">
              {sanitizeContent(result.nameLocationAnalysis)}
            </p>
          </Section>
        )}

        <Section title="八字总评" icon={<LibraryBig className="w-5 h-5" />}>
          <p className="text-[14px] leading-[1.8] text-slate-700 whitespace-pre-line text-justify font-medium">
            {sanitizeContent(result.summary)}
          </p>
        </Section>

        {result.recent && (
          <Section title="未来3年运势" icon={<Sparkles className="w-5 h-5" />}>
            <p className="text-[14px] leading-[1.8] text-slate-600 whitespace-pre-line text-justify">
              {sanitizeContent(result.recent)}
            </p>
          </Section>
        )}
      </div>

      {/* 四柱细批 */}
      <div className="grid grid-cols-2 gap-x-12 gap-y-10 border-t border-slate-100 mt-12 pt-10 break-inside-avoid">
        <ResultCard title="事业与学业" icon={<Briefcase className="w-5 h-5" />} content={result.career} />
        <ResultCard title="财富与金钱" icon={<Coins className="w-5 h-5" />} content={result.wealth} />
        <ResultCard title="家庭与六亲" icon={<Heart className="w-5 h-5" />} content={result.family} />
        <ResultCard title="健康与寿考" icon={<Activity className="w-5 h-5" />} content={result.health} />
      </div>

      {/* 图表区域 */}
      <div className="mt-12 pt-10 border-t border-slate-100 break-inside-avoid print:break-before-page">
        <Section title="一生天命走势图" icon={<TrendingUp className="w-5 h-5" />}>
          <div className="mt-4">
            <FortuneChart decades={result.decades} birthDate={userInfo?.date} />
          </div>
        </Section>
      </div>

      {/* 大运时间轴 */}
      {result.decades && result.decades.length > 0 && (
        <div className="mt-12 pt-10 border-t border-slate-100">
          <Section title="大运流转 (十年一运)" icon={<History className="w-5 h-5" />}>
            <div className="mt-6 grid grid-cols-1 gap-4">
              {result.decades.map((decade: any, idx: number) => {
                const isCurrent = idx === currentDecadeIndex;
                return (
                  <div key={idx} className={`flex items-baseline gap-6 p-2 transition-all break-inside-avoid ${isCurrent ? "font-bold text-slate-900 border-l-2 border-slate-900 pl-4 bg-slate-50" : "text-slate-500"}`}>
                    <div className={`w-16 shrink-0 font-serif text-sm ${isCurrent ? "text-slate-900" : "text-slate-400"}`}>
                      {decade.ageRange}
                    </div>
                    <div className={`flex-1 text-[13px] leading-[1.8]`}>
                      {sanitizeContent(decade.description)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      )}

      {/* 页脚 - 易经箴言在此显示 */}
      <div className="mt-16 pt-12 border-t border-slate-900/10 text-center flex flex-col items-center">
        <div className="mb-4 flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">易经箴言</span>
        </div>
        <p className="text-base font-sans font-bold text-slate-600 mb-8 max-w-lg leading-relaxed text-center px-4">
          "{result.iChingQuote || "天数难测，唯德报之"}"
        </p>
        <div className="flex flex-col items-center gap-1 opacity-20 hover:opacity-40 transition-opacity">
          <div className="flex items-center gap-2">
            <Compass size={18} />
            <span className="text-[10px] tracking-[0.5em] uppercase font-serif">life.fanso.site</span>
          </div>
          <span className="text-[9px] font-serif uppercase tracking-widest">Calculated on {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-indigo-100 pb-2">
        <div className="flex items-center gap-3">
          <div className="text-indigo-500">{icon}</div>
          <h3 className="text-lg font-serif font-bold text-indigo-950 tracking-widest">{title}</h3>
        </div>
        <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-400 to-transparent rounded-full" />
      </div>
      <div className="pl-4">
        {children}
      </div>
    </div>
  );
}

function ResultCard({ title, icon, content }: { title: string; icon: React.ReactNode; content: string }) {
  if (!content) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 border-b border-indigo-100 pb-2">
        <div className="flex items-center gap-3">
          <div className="text-indigo-500">{icon}</div>
          <h3 className="text-md font-serif font-bold text-indigo-950 tracking-wider">{title}</h3>
        </div>
        <div className="h-0.5 w-16 bg-gradient-to-r from-purple-400 to-transparent rounded-full" />
      </div>
      <div className="pl-4">
        <p className="text-[14px] leading-[1.8] text-indigo-900 whitespace-pre-line text-justify">
          {content.trim().replace(/\n{3,}/g, "\n\n")}
        </p>
      </div>
    </div>
  );
}
