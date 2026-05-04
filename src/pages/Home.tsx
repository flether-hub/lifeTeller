import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Bagua } from "../components/Bagua";
import {
  Sparkles,
  MapPin,
  User,
  Users,
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  MessageSquareText,
  Loader2,
  History,
} from "lucide-react";
import { cn } from "../lib/utils";
import { FortuneChart } from "../components/FortuneChart";
import { StarryBackground } from "../components/StarryBackground";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FortuneResultView } from "../components/FortuneResultView";
import { useReading } from "../context/ReadingContext";

import { generateExportData } from "../lib/exportUtils";

const PROVINCES = [
  "北京",
  "天津",
  "河北",
  "山西",
  "内蒙古",
  "辽宁",
  "吉林",
  "黑龙江",
  "上海",
  "江苏",
  "浙江",
  "安徽",
  "福建",
  "江西",
  "山东",
  "河南",
  "湖北",
  "湖南",
  "广东",
  "广西",
  "海南",
  "重庆",
  "四川",
  "贵州",
  "云南",
  "西藏",
  "陕西",
  "甘肃",
  "青海",
  "宁夏",
  "新疆",
  "台湾",
  "香港",
  "澳门",
  "海外",
];

const SHICHEN = [
  { label: "子时 (23:00-01:00)", value: "子时" },
  { label: "丑时 (01:00-03:00)", value: "丑时" },
  { label: "寅时 (03:00-05:00)", value: "寅时" },
  { label: "卯时 (05:00-07:00)", value: "卯时" },
  { label: "辰时 (07:00-09:00)", value: "辰时" },
  { label: "巳时 (09:00-11:00)", value: "巳时" },
  { label: "午时 (11:00-13:00)", value: "午时" },
  { label: "未时 (13:00-15:00)", value: "未时" },
  { label: "申时 (15:00-17:00)", value: "申时" },
  { label: "酉时 (17:00-19:00)", value: "酉时" },
  { label: "戌时 (19:00-21:00)", value: "戌时" },
  { label: "亥时 (21:00-23:00)", value: "亥时" },
  { label: "不知时辰", value: "未知" },
];

const TONE_OPTIONS = [
  "通俗易懂",
  "幽默风趣",
  "严肃认真",
  "文言古籍",
  "温柔鼓励",
  "毒舌犀利",
  "赛博朋克",
  "中二动漫",
  "极简高深",
];

const MODE_OPTIONS = ["精要模式", "深度解读"];

interface FortuneResult {
  summary: string;
  recent: string;
  career: string;
  wealth: string;
  family: string;
  health: string;
  decades: Array<{
    ageRange: string;
    description: string;
    career: number;
    wealth: number;
    family: number;
    health: number;
  }>;
  luckyNumbers: string;
  luckyColors: string;
  iChingQuote: string;
}

export default function Home() {
  const [name, setName] = useState(
    () => localStorage.getItem("last_name") || "",
  );
  const [gender, setGender] = useState(
    () => localStorage.getItem("last_gender") || "男",
  );
  const [calendarType, setCalendarType] = useState(
    () => localStorage.getItem("last_calendarType") || "阳历",
  );
  const [date, setDate] = useState(
    () => localStorage.getItem("last_date") || "2000-01-01",
  );
  const [time, setTime] = useState(
    () => localStorage.getItem("last_time") || SHICHEN[0].value,
  );
  const [province, setProvince] = useState(
    () => localStorage.getItem("last_province") || PROVINCES[0],
  );
  const [tone, setTone] = useState(
    () => localStorage.getItem("last_tone") || TONE_OPTIONS[0],
  );
  const [mode, setMode] = useState(
    () => localStorage.getItem("last_mode") || MODE_OPTIONS[0],
  );

  const {
    isReading,
    setIsReading,
    result,
    setResult,
    error,
    setError,
    debugLogs,
    setDebugLogs,
  } = useReading();
  const [showDebug, setShowDebug] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportReadyUrl, setExportReadyUrl] = useState<string | null>(null);
  const [exportType, setExportType] = useState<"pdf" | "image">("pdf");
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [debugLogs, error]);

  const [hasLastReading, setHasLastReading] = useState(false);
  useEffect(() => {
    try {
      const item = localStorage.getItem("last_reading");
      if (item) setHasLastReading(true);
    } catch (e) {}
  }, []);

  const handleRestoreLastReading = () => {
    try {
      const item = localStorage.getItem("last_reading");
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed && parsed.result) {
          setName(parsed.userInfo?.name || "");
          setGender(parsed.userInfo?.gender || "男");
          setDate(parsed.userInfo?.date || "");
          setTime(parsed.userInfo?.time || SHICHEN[0].value);
          setProvince(parsed.userInfo?.province || PROVINCES[0]);
          setCalendarType(parsed.userInfo?.calendarType || "阳历");
          setResult(parsed.result);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch (e) {
      console.error(e);
      alert("抱歉，未能成功恢复历史测算记录，请重新测算。");
    }
  };

  const [config, setConfig] = useState({ totalLeft: 0, ipLeft: 0 });

  useEffect(() => {
    fetch("/api/config")
      .then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return {};
        }
      })
      .then((data) => setConfig(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !province) {
      setError("缘主，请填写姓名和出生地，以保算命准确。");
      return;
    }
    if (!date) {
      setError("缘主，请至少年月日输入准确的出生日期");
      return;
    }

    const parseDateStr = (dateStr: string) => {
      const nums = dateStr.match(/\d+/g);
      if (nums && nums.length >= 3) {
        const year = parseInt(nums[0]);
        const month = parseInt(nums[1]);
        const day = parseInt(nums[2]);
        if (
          year >= 1900 &&
          year <= 2100 &&
          month >= 1 &&
          month <= 12 &&
          day >= 1 &&
          day <= 31
        ) {
          const d = new Date(year, month - 1, day);
          if (
            d.getFullYear() === year &&
            d.getMonth() === month - 1 &&
            d.getDate() === day
          ) {
            return true;
          }
        }
      }
      return false;
    };

    if (!parseDateStr(date)) {
      setError(
        "出生日期格式不合法，请确保年份在 1900~2100 间且日期有效 (例如: 2000-01-01)",
      );
      return;
    }

    localStorage.setItem("last_name", name);
    localStorage.setItem("last_gender", gender);
    localStorage.setItem("last_calendarType", calendarType);
    localStorage.setItem("last_date", date);
    localStorage.setItem("last_time", time);
    localStorage.setItem("last_province", province);
    localStorage.setItem("last_tone", tone);
    localStorage.setItem("last_mode", mode);

    setIsReading(true);
    setResult(null);
    setError(null);
    setDebugLogs([]);

    const addLog = (log: string) => {
      setDebugLogs((prev) => [...prev, log]);
    };

    try {
      const checkRes = await fetch("/api/fortune/check", { method: "POST" });
      const checkText = await checkRes.text();
      let checkData: any = {};
      try {
        checkData = JSON.parse(checkText);
      } catch (e) {
        if (!checkRes.ok) throw new Error(checkText || checkRes.statusText);
      }

      if (checkData.error) {
        throw new Error(checkData.error);
      }

      if (!checkRes.ok) {
        throw new Error("Rate limit exceeded");
      }

      const prompt = `你是一位精通中国传统命理学的大师，深谙《易经》、阴阳五行、天干地支与八字命理。
一位名叫 ${name}（性别：${gender}）的求测者，出生于【${calendarType}】${date} ${time}，出生地为【${province}】，前来寻求指点。
请严格依据传统八字命理，为他推测四柱八字并推演命运。

### 核心任务：
1. 推算生辰八字（年、月、日、时柱，包含天干、地支、五行）。
2. 分析姓名与出生地对运势的影响。
3. 对流年大运进行 0 到 100 岁的十年分段评分（事业、财富、感情、健康四个维度）。
4. 提供开运建议（幸运数字、颜色）和易经格言。

### 输出准则（极其重要）：
- **必须**返回一个紧凑且合法的 JSON 对象。
- **严禁**包含任何 Markdown 格式代码块（如 \`\`\`json）。
- **严禁**输出省略号（如 "..." 或 "省略" 等）。务必完整输出所有数组元素！
- **严禁**包含 JSON 以外的任何文本、开场白、解释或结束语。
- **语气风格**：【${tone}】。
- **字数要求**：${mode === "精要模式" ? "全文重点突出，总长限制在 600 字以内" : "全文详尽深刻，总长限制在 1200 字以内"}。

### JSON 结构要求 (注意不要输出格式之外的注释，必须输出完整的列表数据)：
{
  "bazi": [
    {"pillar": "年柱", "gan": "天干", "zhi": "地支", "wuXing": "五行"},
    {"pillar": "月柱", "gan": "天干", "zhi": "地支", "wuXing": "五行"},
    {"pillar": "日柱", "gan": "天干", "zhi": "地支", "wuXing": "五行"},
    {"pillar": "时柱", "gan": "天干", "zhi": "地支", "wuXing": "五行"}
  ],
  "nameLocationAnalysis": "姓名与地理位置的综合解读文本...",
  "summary": "人生总体评分与核心命题...",
  "recent": "近期流年运势深度分析（必须包含去年、今年及未来3年，共计5年的具体年份运势分析）...",
  "career": "事业运势与建议...",
  "wealth": "财运走向与理财建议...",
  "family": "感情婚姻与家庭关系...",
  "health": "健康、体质与注意事项...",
  "decades": [
     {"ageRange": "0-10岁", "description": "运势简述与建议", "career": 70, "wealth": 45, "family": 80, "health": 90},
     {"ageRange": "10-20岁", "description": "...", "career": 70, "wealth": 45, "family": 80, "health": 90}
  ], // 注意：这里的 decades 数组必须按10年一段，提供到100岁的所有共10个阶段，不要用省略号
  "luckyNumbers": "建议的 1-9 之间的 3 个互不重复的单数（奇数），以逗号分隔",
  "luckyColors": "建议的 3 种生旺颜色，以逗号分隔",
  "iChingQuote": "针对命局推演出的《易经》原文格言"
}`;

      addLog("正在连接天机命盘，准备调用大语言模型...");
      const genRes = await fetch("/api/fortune/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!genRes.ok) {
        const errText = await genRes.text();
        let errStr = errText || genRes.statusText;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error) {
            errStr =
              typeof errJson.error === "string"
                ? errJson.error
                : JSON.stringify(errJson.error);
          }
        } catch (e) {}
        if (errStr.includes("Rate exceeded") || errStr.includes("429"))
          errStr = "官方 AI 接口限制，请稍后重试。";
        else if (errStr.includes("503") || errStr.includes("high demand"))
          errStr = "官方 AI 接口当前拥挤 (503)，请稍后重试。";
        else if (errStr.includes("ApiError"))
          errStr = "官方 AI 接口请求失败，请稍后重试。";

        throw new Error(`请求失败: ${errStr}`);
      }

      const contentType = genRes.headers.get("Content-Type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("服务未就绪，请几秒后再操作（或刷新页面）。");
      }

      const reader = genRes.body?.getReader();
      if (!reader) throw new Error("无法读取服务器响应");

      const decoder = new TextDecoder();
      let fullText = "";
      let lastReportedLen = 0;
      const progressPhases = [
        { th: 50, msg: "大语言模型连接成功，正在推盘..." },
        { th: 150, msg: "洞察八字格局，排演流年大运..." },
        { th: 300, msg: "测算财富机运，推求前程事业..." },
        { th: 500, msg: "勘破家庭尘缘，参详健康吉凶..." },
        { th: 800, msg: "总批一生起伏，生成终局断言..." },
        { th: 1200, msg: "排版天机命理数据..." },
      ];

      addLog("[AI] 与天机枢纽握手成功，开始接收推演数据流...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        
        // Progressively emit friendly log messages instead of dumping raw JSON
        const len = fullText.length;
        for (const phase of progressPhases) {
          if (len >= phase.th && lastReportedLen < phase.th) {
            addLog(`[AI] ${phase.msg}`);
            lastReportedLen = phase.th;
          }
        }
      }

      if (fullText.trim().toLowerCase().startsWith("<!doctype html>") || fullText.trim().startsWith("<!")) {
        throw new Error("服务正在重启或无响应，请稍后再试。");
      }

      if (fullText.includes("--STREAM-ERROR--")) {
        throw new Error(
          "AI 推演过程中断:" + fullText.split("--STREAM-ERROR--")[1],
        );
      }

      let resultJson = fullText;
      if (resultJson.includes("--STREAM-START--\n")) {
        resultJson = resultJson.split("--STREAM-START--\n")[1];
      } else if (resultJson.includes("--STREAM-START--")) {
        resultJson = resultJson.split("--STREAM-START--")[1];
      }
      resultJson = resultJson
        .replace(/```(?:json)?/gi, "")
        .replace(/```/g, "")
        .trim();
      addLog("天机已现，后台生成成功，正在进行深度校验...");

      // Ultra-Robust JSON Extraction and Cleaning
      const extractAndParseJson = (rawText: string) => {
        const text = rawText.replace(/\n/g, "\\n").replace(/\r/g, "").replace(/\t/g, "\\t");
        
        // Step 1: Try direct parse
        try {
          return JSON.parse(text);
        } catch (e) {}

        // Step 2: Extract between first { and last }
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const candidate = text.substring(firstBrace, lastBrace + 1);
          try {
             return JSON.parse(
              candidate
                .replace(/[\u0000-\u001F]+/g, " ") // Clean control chars
                .replace(/,\s*([}\]])/g, "$1"), // Clean trailing commas
            );
          } catch (e) {}
        }

        // Step 3: Progressive block extraction (original logic improved)
        let startPos = text.indexOf("{");
        while (startPos !== -1) {
          let balance = 0;
          let inString = false;
          let escape = false;
          let candidate = "";

          for (let i = startPos; i < text.length; i++) {
            const char = text[i];
            candidate += char;
            if (escape) {
              escape = false;
              continue;
            }
            if (char === "\\") {
              escape = true;
              continue;
            }
            if (char === '"') {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === "{") balance++;
              else if (char === "}") {
                balance--;
                if (balance === 0) {
                  try {
                    const parsed = JSON.parse(
                      candidate
                        .replace(/[\u0000-\u001F]+/g, " ")
                        .replace(/,\s*([}\]])/g, "$1"),
                    );
                    if (parsed && typeof parsed === "object") return parsed;
                  } catch (e) {}
                }
              }
            }
          }
          startPos = text.indexOf("{", startPos + 1);
        }
        return null;
      };

      let parsed = extractAndParseJson(resultJson);

      // Handle double-encoded JSON where the main object has a `result` string property
      if (parsed && typeof parsed === "object" && typeof parsed.result === "string") {
        try {
          const innerParsed = extractAndParseJson(parsed.result);
          if (innerParsed && typeof innerParsed === "object") {
            parsed = innerParsed;
          }
        } catch (e) {}
      }

      if (!parsed || typeof parsed !== "object") {
        throw new Error(
          `天机蒙尘：解析命理数据失败。AI 返回了非标准格式，请点击“重试”或更换语气后再测。`,
        );
      }

      // Step 4: Schema Validation & Default Filling
      const requiredFields = [
        "bazi",
        "summary",
        "recent",
        "career",
        "wealth",
        "family",
        "health",
        "decades",
        "iChingQuote",
      ];
      const missingFields = requiredFields.filter((f) => !parsed[f]);

      if (missingFields.length > 3) {
        // Too many missing fields
        throw new Error(
          `命局残缺：AI 生成的命理报告不完整，关键信息缺失。请尝试“深度解读”模式。`,
        );
      }

      // Fill defaults for minor missing fields
      const validated: any = {
        bazi: parsed.bazi || [],
        nameLocationAnalysis:
          parsed.nameLocationAnalysis ||
          "测算环境复杂，姓名与地利之气相互交织，利于稳中求进。",
        summary: parsed.summary || "命局中平，需修身养性，以待时机。",
        recent: parsed.recent || "近期运势交替，宜守不宜攻。",
        career: parsed.career || "事业平稳过渡，贵人在侧。",
        wealth: parsed.wealth || "财气内敛，建议开源节流。",
        family: parsed.family || "家庭和睦是福，宜多沟通。",
        health: parsed.health || "注意规律作息，平和心态。",
        decades: (parsed.decades || []).map((d: any) => ({
          ageRange: d.ageRange || "未知阶段",
          description: d.description || "运势平稳",
          career: Number(d.career) || 50,
          wealth: Number(d.wealth) || 50,
          family: Number(d.family) || 50,
          health: Number(d.health) || 50,
        })),
        luckyNumbers: parsed.luckyNumbers || "1, 3, 9",
        luckyColors: parsed.luckyColors || "青色、褐色",
        iChingQuote: parsed.iChingQuote || "天行健，君子以自强不息。",
      };

      addLog("数据校验通过，正在合入天机命盘数据库...");
      await fetch("/api/fortune/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender,
          calendar_type: calendarType,
          date,
          time,
          province,
          resultJson: validated,
        }),
      });
      addLog("结果保存成功。");

      const lastReading = {
        userInfo: { name, gender, date, time, province, calendarType },
        result: validated as FortuneResult,
      };
      try {
        localStorage.setItem("last_reading", JSON.stringify(lastReading));
      } catch (e) {}

      setResult(validated as FortuneResult);
      setIsReading(false);

      fetch("/api/config")
        .then(async (r) => {
          const text = await r.text();
          try {
            return JSON.parse(text);
          } catch {
            return {};
          }
        })
        .then((d) => setConfig(d));
    } catch (err: any) {
      setError(err.message);
      setShowDebug(true);
      addLog(err.message);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setDebugLogs([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 selection:bg-blue-500/30 overflow-x-hidden flex flex-col bg-[#f8f9fa]">
      {/* Fixed Header */}
      <Header config={config} />

      {/* Hero Section */}
      <div className="relative pt-20 pb-8 md:pt-24 md:pb-10 px-4 z-10 flex flex-col items-center flex-shrink-0">
        <StarryBackground />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 text-white/90 text-sm shadow-sm">
            <Sparkles size={14} className="text-amber-400" /> AI
            驱动易经八字推演
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight drop-shadow-lg">
            天命微茫·八字探微
          </h1>
          <p className="text-sm md:text-base text-slate-200 font-light leading-relaxed mb-6 drop-shadow">
            深度解析您的生辰八字，融合传统易经与现代大模型技术，
            <br />
            为您推演一生大运起伏、近期运势走向，并预测事业、财富、健康与姻缘的未来轨迹。
          </p>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="relative bg-[#f8f9fa] flex-1 z-20 w-full pt-8 pb-8 border-t border-slate-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <main className="container mx-auto px-4 max-w-6xl flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Main Content (Form/Loading/Result) */}
          <div
            className={cn(
              "w-full flex flex-col",
              result || isReading ? "max-w-4xl" : "lg:flex-1 max-w-3xl",
            )}
          >
            <AnimatePresence mode="wait">
              {!result && !isReading && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-6"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Graphic Side */}
                    <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-8">
                      <Bagua isReading={false} />
                      <div className="mt-8 text-center text-sm text-slate-400">
                        <p>一命二运三风水</p>
                        <p>四积阴德五读书</p>
                      </div>
                    </div>

                    {/* Form Side */}
                    <div className="w-full md:w-2/3">
                      {hasLastReading && (
                        <div className="mb-6 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center shrink-0">
                              <History size={16} className="text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                发现您有最近一次的测算记录
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRestoreLastReading}
                            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl shadow-sm border border-slate-200 transition whitespace-nowrap ml-4 shrink-0"
                          >
                            查看报告
                          </button>
                        </div>
                      )}
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <User size={16} className="text-slate-500" />{" "}
                              阁下尊姓大名
                            </label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-serif"
                              placeholder="推荐真实姓名"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <MapPin size={16} className="text-slate-500" />{" "}
                              出生省份
                            </label>
                            <select
                              value={province}
                              onChange={(e) => setProvince(e.target.value)}
                              className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all appearance-none"
                            >
                              {PROVINCES.map((p) => (
                                <option
                                  key={p}
                                  value={p}
                                  className="bg-white text-slate-800"
                                >
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <CalendarIcon
                                size={16}
                                className="text-slate-500"
                              />{" "}
                              日历类型
                            </label>
                            <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                              {["阳历", "阴历"].map((type) => (
                                <button
                                  type="button"
                                  key={type}
                                  onClick={() => setCalendarType(type)}
                                  className={cn(
                                    "flex-1 py-2 text-sm rounded-lg transition-all",
                                    calendarType === type
                                      ? "bg-white text-slate-800 shadow-sm border border-slate-200 font-medium"
                                      : "text-slate-500 hover:text-slate-700",
                                  )}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <CalendarDays
                                size={16}
                                className="text-slate-500"
                              />{" "}
                              出生日期
                            </label>
                            <input
                              type="text"
                              required
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              placeholder="例如: 1990年1月1日 或 1990-01-01"
                              className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all placeholder:text-slate-300"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <Clock size={16} className="text-slate-500" />{" "}
                              出生时辰
                            </label>
                            <select
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all appearance-none"
                            >
                              {SHICHEN.map((t) => (
                                <option
                                  key={t.value}
                                  value={t.value}
                                  className="bg-white text-slate-800"
                                >
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <Users size={16} className="text-slate-500" />{" "}
                              性别
                            </label>
                            <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200 mt-[2px] h-[48px] items-center">
                              {["男", "女"].map((g) => (
                                <button
                                  type="button"
                                  key={g}
                                  onClick={() => setGender(g)}
                                  className={cn(
                                    "flex-1 py-1.5 text-sm rounded-lg transition-all h-full",
                                    gender === g
                                      ? "bg-white text-slate-800 shadow-sm border border-slate-200 font-medium"
                                      : "text-slate-500 hover:text-slate-700",
                                  )}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <Sparkles size={16} className="text-slate-500" />{" "}
                              解读模式
                            </label>
                            <select
                              value={mode}
                              onChange={(e) => setMode(e.target.value)}
                              className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all appearance-none"
                            >
                              {MODE_OPTIONS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <MessageSquareText
                                size={16}
                                className="text-slate-500"
                              />{" "}
                              解读语气
                            </label>
                            <select
                              value={tone}
                              onChange={(e) => setTone(e.target.value)}
                              className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all appearance-none"
                            >
                              {TONE_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {error && (
                          <div className="text-rose-600 text-sm bg-rose-50 p-3 rounded-lg border border-rose-200">
                            <span className="font-bold">⚠️ 出错提示：</span>
                            {error}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full mt-2 relative overflow-hidden rounded-xl bg-slate-800 text-white shadow-lg transition-all hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={config.ipLeft <= 0 || config.totalLeft <= 0}
                        >
                          <div className="relative flex items-center justify-center gap-2 px-6 py-4">
                            <Sparkles size={18} className="text-amber-400" />
                            <span className="font-serif text-lg font-bold tracking-widest text-white">
                              {config.ipLeft <= 0 || config.totalLeft <= 0
                                ? "今日额度已用完，请明日再来"
                                : "开演八字神机"}
                            </span>
                          </div>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Debug Logs Section */}
                  {debugLogs.length > 0 && showDebug && (
                    <div className="hidden" />
                  )}
                </motion.div>
              )}

              {isReading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-12 flex flex-col items-center flex-1"
                >
                  <div className="mb-6 w-full max-w-lg bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm h-48 overflow-y-auto text-left relative flex flex-col font-mono text-sm ring-1 ring-slate-900/5 select-text">
                    <div className="flex flex-col gap-2">
                      {debugLogs.map((log, index) => (
                        <div
                          key={index}
                          className="text-slate-600 break-words whitespace-pre-wrap border-b border-slate-100 last:border-0 pb-1 last:pb-0"
                        >
                          {log}
                        </div>
                      ))}
                      {error && (
                        <div className="text-rose-500 font-medium break-words mt-2 p-3 bg-rose-50 rounded-xl border border-rose-100/50">
                          {error}
                        </div>
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                  <Bagua isReading={!error} />
                  <p className="text-2xl font-serif text-slate-800 mt-8 animate-pulse tracking-widest drop-shadow-sm">
                    {error ? "推演中断" : "正在参详天地造化，推演流年大运..."}
                  </p>
                  <p className="text-slate-500 mt-2 font-light">
                    {error ? "天数难测，请调整后重试" : "命理玄奥，请稍候片刻"}
                  </p>
                  {error && (
                    <button
                      onClick={() => {
                        setIsReading(false);
                        setError(null);
                      }}
                      className="mt-8 px-8 py-3 bg-slate-800 text-white text-sm font-medium tracking-widest rounded-xl shadow-md hover:bg-slate-700 transition-all border border-slate-700 hover:shadow-lg"
                    >
                      返回重试
                    </button>
                  )}
                </motion.div>
              )}

              {result && !isReading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-4xl mt-8 bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgb(0,0,0,0.06)] overflow-hidden mb-8"
                >
                  <FortuneResultView
                    result={result}
                    userInfo={{
                      name,
                      gender,
                      date,
                      time,
                      province,
                      calendarType,
                    }}
                  />

                  <div className="p-8 pb-12 pt-0 space-y-8">
                    <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
                      <button
                        onClick={async () => {
                          setExportType("pdf");
                          setExportModalOpen(true);
                          setExportReadyUrl(null);
                          try {
                            const { url } = await generateExportData(
                              "fortune-result-content",
                              name,
                              "pdf",
                            );
                            if (url) setExportReadyUrl(url);
                          } catch (err) {
                            console.error(err);
                            setExportModalOpen(false);
                            alert("导出失败，请重试");
                          }
                        }}
                        className="print-hide w-full sm:w-48 justify-center text-white hover:text-white text-sm font-medium tracking-widest border border-slate-800 bg-slate-800 hover:bg-slate-700 px-8 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2"
                      >
                        导出PDF
                      </button>
                      <button
                        onClick={async () => {
                          setExportType("image");
                          setExportModalOpen(true);
                          setExportReadyUrl(null);
                          try {
                            const { url } = await generateExportData(
                              "fortune-result-content",
                              name,
                              "image",
                            );
                            if (url) setExportReadyUrl(url);
                          } catch (err) {
                            console.error(err);
                            setExportModalOpen(false);
                            alert("导出失败，请重试");
                          }
                        }}
                        className="print-hide w-full sm:w-48 justify-center text-slate-800 hover:text-slate-900 text-sm font-medium tracking-widest border border-slate-300 hover:bg-slate-100 px-8 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 bg-white"
                      >
                        导出长图
                      </button>
                      <button
                        onClick={reset}
                        className="print-hide w-full sm:w-48 justify-center text-slate-500 hover:text-slate-700 text-sm font-medium tracking-widest px-8 py-3 rounded-xl transition-all flex items-center"
                      >
                        返回重测
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar: Reminder Bar */}
          {!result && !isReading && (
            <aside className="w-full lg:w-[320px] shrink-0 bg-white border border-slate-100 rounded-[1.5rem] p-6 text-left shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                <h3 className="font-bold text-slate-800 text-base ml-2 tracking-widest leading-none">
                  行期指北
                </h3>
              </div>

              <div className="flex flex-col gap-5 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <span className="text-amber-500 text-lg font-bold leading-tight mt-[-2px]">
                    ✧
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-slate-800 font-bold mr-1">
                      隐私承诺：
                    </strong>
                    建议输入真实姓名和出生地。诚心敬意，方能窥见天机，报告仅暂存在您的浏览器中。
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sky-500 text-lg font-bold leading-tight mt-[-2px]">
                    ✦
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-slate-800 font-bold mr-1">
                      运行建议：
                    </strong>
                    将本站网址复制到系统浏览器中打开，微信直接打开不支持导出报告。
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-lg font-bold leading-tight mt-[-2px]">
                    ♥
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-slate-800 font-bold mr-1">
                      支持我们：
                    </strong>
                    如果觉得算得准，欢迎对我们进行捐赠支持，以保证项目长存。
                    <Link
                      to="/donate"
                      className="text-red-500 font-bold hover:underline ml-1"
                    >
                      去捐赠
                    </Link>
                  </span>
                </div>
              </div>
            </aside>
          )}
        </main>
      </div>

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center shadow-2xl border border-slate-100"
          >
            <h3 className="text-2xl font-bold mb-6 font-serif text-slate-800">
              导出报告
            </h3>
            {!exportReadyUrl ? (
              <div className="flex flex-col items-center">
                <Bagua isReading={true} />
                <p className="text-slate-500 text-sm animate-pulse mt-4 mb-2">
                  正在生成高速图片/PDF，请稍候...
                </p>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-3 mt-4">
                {exportType === "pdf" ? (
                  <a
                    href={exportReadyUrl || "#"}
                    download={`八字测算_${name}.pdf`}
                    onClick={() =>
                      setTimeout(() => setExportModalOpen(false), 500)
                    }
                    className="w-full text-center text-white bg-slate-800 hover:bg-slate-700 font-bold py-3.5 rounded-xl transition-all shadow-sm tracking-widest"
                  >
                    点击下载 PDF
                  </a>
                ) : (
                  <a
                    href={exportReadyUrl || "#"}
                    download={`八字测算_${name}.jpg`}
                    onClick={() =>
                      setTimeout(() => setExportModalOpen(false), 500)
                    }
                    className="w-full text-center text-white bg-slate-800 hover:bg-slate-700 font-bold py-3.5 rounded-xl transition-all shadow-sm tracking-widest"
                  >
                    点击保存图片
                  </a>
                )}
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="w-full text-slate-500 hover:text-slate-800 text-sm py-2 transition-colors"
                >
                  关闭
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Footer */}
      {!result && <Footer />}
    </div>
  );
}
