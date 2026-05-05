import React from "react";
import { FortuneChart } from "./FortuneChart";
import {
  Bot,
  LibraryBig,
  Quote,
  CalendarDays,
  Compass,
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
    if (text.includes("木"))
      return {
        icon: <Leaf size={28} className="text-emerald-500 mb-2" />,
        label: "木",
        color: "bg-[#f0fdf4] text-[#166534] border-emerald-100",
      };
    if (text.includes("火"))
      return {
        icon: <Flame size={28} className="text-orange-500 mb-2" />,
        label: "火",
        color: "bg-[#fff7ed] text-[#c2410c] border-orange-100",
      };
    if (text.includes("土"))
      return {
        icon: <Mountain size={28} className="text-amber-600 mb-2" />,
        label: "土",
        color: "bg-[#fffbeb] text-[#92400e] border-amber-100",
      };
    if (text.includes("金"))
      return {
        icon: <Diamond size={28} className="text-slate-500 mb-2" />,
        label: "金",
        color: "bg-[#f8fafc] text-[#475569] border-slate-200",
      };
    if (text.includes("水"))
      return {
        icon: <Waves size={28} className="text-blue-500 mb-2" />,
        label: "水",
        color: "bg-[#eff6ff] text-[#1e40af] border-blue-100",
      };
    return {
      icon: <Sparkles size={28} className="text-indigo-500 mb-2" />,
      label: "吉",
      color: "bg-[#f5f3ff] text-[#4338ca] border-indigo-100",
    };
  };

  const getColorStyle = (colorName: string) => {
    if (colorName.includes("红"))
      return "bg-[#ef4444] text-white border-[#b91c1c]";
    if (colorName.includes("紫"))
      return "bg-[#a855f7] text-white border-[#7e22ce]";
    if (colorName.includes("粉"))
      return "bg-[#f472b6] text-white border-[#db2777]";
    if (colorName.includes("蓝"))
      return "bg-[#3b82f6] text-white border-[#1d4ed8]";
    if (colorName.includes("黑"))
      return "bg-[#1e293b] text-white border-[#0f172a]";
    if (colorName.includes("银"))
      return "bg-[#e2e8f0] text-slate-800 border-[#cbd5e1]";
    if (colorName.includes("白"))
      return "bg-[#ffffff] text-slate-800 border-slate-200";
    if (colorName.includes("米"))
      return "bg-[#f5f5dc] text-amber-900 border-[#e5e5cb]";
    if (colorName.includes("金"))
      return "bg-[#ffd700] text-yellow-950 border-[#eab308]";
    if (colorName.includes("黄"))
      return "bg-[#ffff00] text-yellow-950 border-[#eab308]";
    if (
      colorName.includes("青") ||
      colorName.includes("绿") ||
      colorName.includes("翠")
    )
      return "bg-[#10b981] text-white border-[#047857]";
    if (colorName.includes("橙"))
      return "bg-[#f97316] text-white border-[#c2410c]";
    if (colorName.includes("灰"))
      return "bg-[#6b7280] text-white border-[#374151]";
    if (
      colorName.includes("棕") ||
      colorName.includes("褐") ||
      colorName.includes("咖")
    )
      return "bg-[#8B4513] text-white border-[#5c2e0b]";
    return "bg-white text-slate-700 border-slate-200"; // Default
  };

  const parseLuckyNumbers = (text: string) => {
    const results: { tag: string; nums: string[] }[] = [];
    let currentNums: string[] = [];
    let pendingTag = "";

    const parts = text.split(/([金木水火土])/);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (["金", "木", "水", "火", "土"].includes(part)) {
        if (currentNums.length > 0) {
          results.push({ tag: part, nums: currentNums });
          currentNums = [];
        } else {
          pendingTag = part;
        }
      } else {
        const nums = part.match(/\d+/g) || [];
        if (nums.length > 0) {
          if (pendingTag) {
            // Ensure unique numbers if desired, but primarily fix multi-digit
            results.push({ tag: pendingTag, nums: Array.from(new Set(nums)) });
            pendingTag = "";
          } else {
            currentNums.push(...nums);
          }
        }
      }
    }

    if (currentNums.length > 0) {
      results.push({ tag: pendingTag, nums: Array.from(new Set(currentNums)) });
    }

    if (results.length === 0) {
      const allNums = text.match(/\d+/g) || [];
      if (allNums.length > 0)
        return [{ tag: "", nums: Array.from(new Set(allNums)) }];
    }

    return results;
  };

  const getWuXingTextColor = (tag: string) => {
    if (tag === "火") return "text-orange-600";
    if (tag === "木") return "text-emerald-700";
    if (tag === "水") return "text-blue-700";
    if (tag === "金") return "text-slate-600";
    if (tag === "土") return "text-amber-800";
    return "text-slate-700";
  };

  const luckyStats = parseWuXing(numbers + " " + colors || "");
  const parsedNumbers = numbers ? parseLuckyNumbers(numbers) : [];

  return (
    <div className="float-none md:float-left w-full md:w-56 md:mr-8 mb-6 md:mb-4 relative">
      <div
        className={`p-6 rounded-[2rem] shadow-sm border border-white/80 ring-1 ring-black/5 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[260px] ${luckyStats.color}`}
      >
        {/* Background decorative Bot icon */}
        <div className="absolute -top-6 -right-6 opacity-10 transition-transform duration-700 hover:rotate-[15deg] hover:scale-110 text-current">
          <Bot size={120} strokeWidth={1} />
        </div>

        {luckyStats.icon}
        <span className="text-[15px] font-bold uppercase tracking-[0.2em] opacity-80 mb-4">
          LUCKY ELEMENTS
        </span>

        {numbers && (
          <div className="mb-5 text-center w-full relative z-10">
            <h4 className="text-[15px] font-serif font-bold tracking-widest mb-2 opacity-90">
              五行吉数
            </h4>
            <div className="flex flex-col gap-2 items-center">
              {parsedNumbers.map((group, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {group.tag && (
                    <span
                      className={`text-base font-bold opacity-80 whitespace-nowrap ${getWuXingTextColor(group.tag)}`}
                    >
                      ({group.tag})
                    </span>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {group.nums.map((n, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-bold font-serif opacity-90 transition-transform hover:-translate-y-1 shrink-0"
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {colors && (
          <div className="text-center w-full relative z-10">
            <h4 className="text-[15px] font-serif font-bold tracking-widest mb-3 opacity-90">
              生旺颜色
            </h4>
            <div className="flex flex-wrap justify-center items-center gap-2">
              {colors
                .split(/[、\s，,;；]+/)
                .filter((c) => c.trim())
                .map((c, i) => {
                  const colorName = c.split(/[（(]/)[0].trim();
                  if (!colorName) return null;
                  const colorClasses = getColorStyle(colorName);
                  return (
                    <div
                      key={i}
                      className={`inline-block px-4 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] border text-[15px] font-serif opacity-95 transition-transform hover:-translate-y-1 ${colorClasses}`}
                    >
                      {colorName}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
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
    <div className="flex justify-center py-6 relative z-10 px-4">
      <svg
        viewBox="0 0 360 180"
        className="w-full max-w-[360px] h-auto drop-shadow-lg font-serif"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.05" />
          </filter>
        </defs>

        <rect
          width="360"
          height="180"
          rx="20"
          fill="url(#bgGrad)"
          stroke="#e2e8f0"
          strokeWidth="1"
          filter="url(#shadow)"
        />

        {/* Decorative elements */}
        <circle
          cx="180"
          cy="90"
          r="70"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx="180"
          cy="90"
          r="50"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />

        {/* Traditional reading is right-to-left. So Year is rightmost, Hour is leftmost */}
        {bazi.map((b, i) => {
          const x = 270 - i * 70;
          return (
            <g key={i} transform={`translate(${x}, 20)`}>
              {/* Pillar Label */}
              <text
                x="20"
                y="15"
                fill="#64748b"
                fontSize="12"
                textAnchor="middle"
                className="tracking-widest"
              >
                {b.pillar}
              </text>

              {/* Box */}
              <rect
                x="0"
                y="25"
                width="40"
                height="80"
                rx="6"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1"
              />

              {/* Gan & Zhi */}
              <text
                x="20"
                y="55"
                fill="#0f172a"
                fontSize="22"
                fontWeight="bold"
                textAnchor="middle"
              >
                {b.gan}
              </text>
              <line
                x1="8"
                y1="65"
                x2="32"
                y2="65"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x="20"
                y="92"
                fill="#0f172a"
                fontSize="22"
                fontWeight="bold"
                textAnchor="middle"
              >
                {b.zhi}
              </text>

              {/* WuXing */}
              <rect
                x="-2"
                y="115"
                width="44"
                height="20"
                rx="10"
                fill="#f1f5f9"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x="20"
                y="129"
                fill="#475569"
                fontSize="10"
                textAnchor="middle"
                className="tracking-widest"
              >
                {b.wuXing}
              </text>
            </g>
          );
        })}
      </svg>
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
  return (
    <div className="w-full bg-slate-50 flex justify-center">
      <div className="w-full max-w-4xl" id="fortune-result-content">
        <FortuneResultViewInner {...props} />
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

  return (
    <div
      className="w-full relative overflow-hidden bg-slate-50 min-h-screen"
      id="fortune-result-content"
    >
      {/* Background SVG Curves */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <svg
          viewBox="0 0 1440 800"
          className="absolute top-0 w-full h-[50vh] object-cover"
          preserveAspectRatio="none"
        >
          <path
            fill="#e0e7ff"
            fillOpacity="0.5"
            d="M0,320L48,288C96,256,192,192,288,186.7C384,181,480,235,576,234.7C672,235,768,181,864,170.7C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
          <path
            fill="#c7d2fe"
            fillOpacity="0.3"
            d="M0,192L48,186.7C96,181,192,171,288,186.7C384,203,480,245,576,234.7C672,224,768,160,864,154.7C960,149,1056,203,1152,208.7C1248,213,1344,171,1392,149.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
        <svg
          viewBox="0 0 1440 800"
          className="absolute bottom-0 w-full h-[50vh] object-cover mix-blend-multiply"
          preserveAspectRatio="none"
        >
          <path
            fill="#ede9fe"
            fillOpacity="0.4"
            d="M0,64L48,85.3C96,107,192,149,288,154.7C384,160,480,128,576,144C672,160,768,224,864,229.3C960,235,1056,181,1152,154.7C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      <div className="relative z-10 pt-8 pb-6 px-4 text-center overflow-hidden">
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-2">
          <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
          <h2 className="text-2xl sm:text-4xl font-serif text-slate-900 font-bold tracking-widest drop-shadow-sm">
            命理玄鉴
          </h2>
          <YinYangIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-800" />
        </div>
        <p className="text-sm sm:text-base text-slate-500 font-light tracking-widest mb-6 flex items-center justify-center gap-2 px-2">
          <span className="max-w-prose">
            {result.iChingQuote ? result.iChingQuote : "天命微茫，八字探微"}
          </span>
        </p>

        {/* User Info Header for PDF */}
        {userInfo && (
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap justify-center gap-x-8 gap-y-3 text-sm sm:text-base text-slate-700 font-serif mb-6 border-y border-indigo-200/50 py-4 max-w-3xl mx-auto bg-white/40 backdrop-blur-md rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] px-4">
            <p className="flex items-center justify-center sm:justify-start gap-2">
              <LibraryBig size={16} className="text-indigo-500 shrink-0" />
              <span>缘主：</span>
              <span className="font-medium text-indigo-950">
                {userInfo.name}（{userInfo.gender}）
              </span>
            </p>
            <p className="flex items-center justify-center sm:justify-start gap-2">
              <Clock size={16} className="text-indigo-500 shrink-0" />
              <span>生辰：</span>
              <span className="font-medium text-indigo-950">
                {userInfo.calendarType} {userInfo.date} {userInfo.time}
              </span>
            </p>
            <p className="flex items-center justify-center sm:justify-start gap-2">
              <MapPin size={16} className="text-indigo-500 shrink-0" />
              <span>出生地：</span>
              <span className="font-medium text-indigo-950">
                {userInfo.province}
              </span>
            </p>
          </div>
        )}

        <BaZiVisual bazi={result.bazi} />

        <div className="max-w-5xl mx-auto mt-6 px-4">
          <div className="bg-white/80 backdrop-blur-xl px-6 py-8 md:px-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white/60 text-left relative ring-1 ring-slate-900/5 flow-root">
            <LuckyVisual
              numbers={result.luckyNumbers}
              colors={result.luckyColors}
            />

            {result.nameLocationAnalysis && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-indigo-800 mb-2 font-serif flex items-center gap-2">
                  <Compass className="w-6 h-6 text-indigo-500" />
                  姓名与方位的命理渊源
                </h3>
                <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
                  {result.nameLocationAnalysis}
                </p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-bold text-indigo-800 mb-2 font-serif flex items-center gap-2">
                <Bot className="w-6 h-6 text-indigo-500" />
                AI 大模型总评
              </h3>
              <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
                {result.summary}
              </p>
            </div>

            {result.recent && (
              <div>
                <h3 className="text-lg font-bold text-indigo-800 mb-2 font-serif flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-500" />
                  近期运势
                </h3>
                <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
                  {result.recent}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-6 relative z-10 max-w-5xl mx-auto">
        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard title="事业与学业" icon="💼" content={result.career} />
          <ResultCard title="财富与金钱" icon="💰" content={result.wealth} />
          <ResultCard title="家庭与六亲" icon="❤️" content={result.family} />
          <ResultCard title="健康与寿考" icon="🌿" content={result.health} />
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 ring-1 ring-slate-900/5">
          <FortuneChart decades={result.decades} birthDate={userInfo?.date} />
        </div>

        {/* Timeline */}
        {result.decades && result.decades.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 break-inside-avoid ring-1 ring-slate-900/5">
            <h3 className="text-xl font-serif text-indigo-900 mb-5 border-b border-indigo-100 pb-3 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-500" />
              大运流转 (十年一运)
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.2rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-200 before:to-transparent">
              {result.decades.map((decade: any, idx: number) => {
                const isCurrent = idx === currentDecadeIndex;
                return (
                  <div
                    key={idx}
                    className="relative flex items-start gap-6 group"
                  >
                    <div
                      className={`mt-1 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 shadow-sm z-10 ${isCurrent ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-500"}`}
                    >
                      {isCurrent ? (
                        <Activity size={16} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      )}
                    </div>
                    <div
                      className={`flex-1 px-5 py-4 flex flex-col sm:flex-row sm:items-baseline gap-2 rounded-2xl border ${isCurrent ? "bg-indigo-50/80 border-indigo-200 shadow-md ring-1 ring-indigo-500/20" : "bg-white/60 border-slate-100 shadow-sm"} backdrop-blur-sm transition-all hover:shadow-md`}
                    >
                      <div
                        className={`font-serif font-bold whitespace-nowrap text-base sm:text-lg ${isCurrent ? "text-indigo-700" : "text-slate-800"}`}
                      >
                        {decade.ageRange}：
                      </div>
                      <div
                        className={`leading-relaxed text-sm sm:text-base ${isCurrent ? "text-indigo-950 font-medium" : "text-slate-600"}`}
                      >
                        {decade.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pb-10 pt-10 border-t border-indigo-100/50 text-center relative z-10 flex flex-col items-center justify-center gap-3 bg-white/40 backdrop-blur-sm">
        {result.iChingQuote && (
          <div className="mb-4">
            <span className="font-serif italic text-lg text-slate-600 bg-slate-100/50 px-6 py-3 rounded-2xl border border-slate-200/50">
              "{result.iChingQuote}"
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-indigo-400">
          <Compass size={14} />
          <span className="font-serif tracking-widest text-sm">
            life.fanso.site
          </span>
        </div>
        <div className="text-[15px] text-slate-400 font-serif">
          排演时间：{new Date().toLocaleDateString("zh-CN")}
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  title,
  icon,
  content,
}: {
  title: string;
  icon: string;
  content: string;
}) {
  if (!content) return null;
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all ring-1 ring-slate-900/5">
      <h3 className="text-lg font-serif text-indigo-950 mb-3 border-b border-indigo-50 pb-2 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
        {content}
      </p>
    </div>
  );
}
