// import { useState, useEffect } from "react";
// import { Briefcase, Pickaxe, Zap, Sun, SlidersHorizontal, Clock } from "lucide-react";

// export default function KekaTimer() {
//   const [baseHours, setBaseHours] = useState(8);
//   const [isCustom, setIsCustom] = useState(false);
//   const [customHours, setCustomHours] = useState(7);
//   const [inputLines, setInputLines] = useState("");
//   const [nowTick, setNowTick] = useState(Date.now());

//   useEffect(() => {
//     // Update the "now" time every second to keep the timer live
//     const interval = setInterval(() => {
//       setNowTick(Date.now());
//     }, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   const handleModeClick = (hours) => {
//     setIsCustom(false);
//     setBaseHours(hours);
//   };

//   const handleCustomClick = () => {
//     setIsCustom(true);
//     setBaseHours(customHours);
//   };

//   const parseTimeToday = (timeStr) => {
//     if (!timeStr || timeStr.toUpperCase().includes("MISSING")) return null;
//     const cleaned = timeStr.trim().replace(/\s+/g, " ").toUpperCase();
//     const today = new Date();
//     const parts = cleaned.split(" ");
//     if (parts.length < 2) return null;
    
//     const time = parts[0];
//     const meridian = parts[1];
    
//     const timeParts = time.split(":").map(Number);
//     if (timeParts.length < 2) return null;
    
//     const h = timeParts[0];
//     const m = timeParts[1];
//     const s = timeParts[2] || 0;
    
//     let hours = h % 12;
//     if (meridian === "PM") hours += 12;
    
//     return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, m, s);
//   };

//   const formatTime = (date) => {
//     if (!date) return "-";
//     return date.toLocaleTimeString("en-IN", {
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hour12: true,
//     });
//   };

//   const msToHMS = (ms) => {
//     if (ms < 0) ms = 0;
//     const totalMin = Math.floor(ms / 60000);
//     const h = Math.floor(totalMin / 60);
//     const m = totalMin % 60;
//     return `${h}h ${m.toString().padStart(2, "0")}m`;
//   };

//   const calculateResult = () => {
//     const lines = inputLines.trim().split(/\r?\n/).filter(Boolean);
//     if (lines.length === 0) {
//       return { error: "utaval che ?" };
//     }

//     const punchIn = parseTimeToday(lines[0]);
//     if (!punchIn) {
//       return { error: "Invalid time format" };
//     }

//     const targetWorkMs = baseHours * 60 * 60 * 1000;
//     let totalBreakMs = 0;

//     for (let i = 1; i < lines.length; i += 2) {
//       const out = parseTimeToday(lines[i]);
//       const inn = parseTimeToday(lines[i + 1]);
//       if (out && inn) {
//         totalBreakMs += inn - out;
//       } else if (out && !inn) {
//         totalBreakMs += nowTick - out;
//       }
//     }

//     const theoreticalPunchOut = new Date(punchIn.getTime() + targetWorkMs + totalBreakMs);
//     let workedMs = nowTick - punchIn.getTime() - totalBreakMs;
//     if (workedMs < 0) workedMs = 0;

//     const workedHours = workedMs / (1000 * 60 * 60);

//     let statusClass = "";
//     let statusText = "";

//     if (workedHours >= baseHours) {
//       statusClass = "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse";
//       statusText = "JALDI BHAGO! TIME PATI GYO!";
//     } else if (workedHours >= 9) {
//       statusClass = "text-amber-500";
//       statusText = "9 pura!";
//     } else if (workedHours >= 8.5) {
//       statusClass = "text-amber-500";
//       statusText = "8.5 pura!";
//     } else {
//       statusClass = "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]";
//       statusText = "hju var che kam kro ";
//     }

//     return {
//       workedMs,
//       workedHours,
//       statusClass,
//       statusText,
//       targetWorkMs,
//       totalBreakMs,
//       punchIn,
//       theoreticalPunchOut,
//     };
//   };

//   const res = calculateResult();

//   return (
//     <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-gray-100 font-sans animate-fadeIn">
//       <div className="text-center mb-8">
//         <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
//           KEKA TIME METER
//         </h1>
//         <p className="text-gray-400 text-lg">Know exactly when you can escape! 🚀</p>
//       </div>

//       <div className="flex flex-wrap justify-center gap-3 mb-6">
//         <button
//           onClick={() => handleModeClick(8)}
//           className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
//             !isCustom && baseHours === 8
//               ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
//               : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
//           }`}
//         >
//           <Briefcase size={18} /> Product (8h)
//         </button>
//         <button
//           onClick={() => handleModeClick(8.5)}
//           className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
//             !isCustom && baseHours === 8.5
//               ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
//               : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
//           }`}
//         >
//           <Pickaxe size={18} /> CF (8.5h)
//         </button>
//         <button
//           onClick={() => handleModeClick(9)}
//           className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
//             !isCustom && baseHours === 9
//               ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
//               : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
//           }`}
//         >
//           <Zap size={18} /> 9 Hours
//         </button>
//         <button
//           onClick={() => handleModeClick(5)}
//           className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
//             !isCustom && baseHours === 5
//               ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
//               : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
//           }`}
//         >
//           <Sun size={18} /> Half Day
//         </button>
//       </div>

//       <div className="flex flex-wrap justify-center gap-3 mb-8">
//         {isCustom && (
//           <input
//             type="number"
//             step="0.25"
//             min="1"
//             value={customHours}
//             onChange={(e) => {
//               setCustomHours(Number(e.target.value));
//               setBaseHours(Number(e.target.value));
//             }}
//             className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-center text-white w-32 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
//           />
//         )}
//         <button
//           onClick={handleCustomClick}
//           className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
//             isCustom
//               ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
//               : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
//           }`}
//         >
//           <SlidersHorizontal size={18} /> Custom for early leave
//         </button>
//       </div>

//       <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700 shadow-inner mb-8">
//         <label className="flex items-center gap-2 text-gray-300 font-medium mb-3">
//           <Clock size={16} /> Paste KEKA Time stamps Here:
//         </label>
//         <textarea
//           value={inputLines}
//           onChange={(e) => setInputLines(e.target.value)}
//           placeholder={`Example:\n9:20:36 AM\n1:01:21 PM\n1:44:46 PM\nMISSING`}
//           className="w-full min-h-[140px] p-4 bg-gray-900/50 border border-gray-600 rounded-xl text-gray-100 font-mono text-base resize-y focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
//         />
//       </div>

//       <div className="text-center">
//         {res.error ? (
//           <div className="text-red-400 text-xl font-medium mt-4">{res.error}</div>
//         ) : (
//           <div className="animate-slideDown">
//             <div className="text-3xl text-yellow-400 font-bold tracking-wide mb-4">
//               Worked Till Now : {msToHMS(res.workedMs)}
//             </div>
            
//             <div className={`text-4xl md:text-5xl font-extrabold mb-6 ${res.statusClass}`}>
//               {res.statusText}
//             </div>

//             {res.workedHours >= baseHours ? (
//               <div className="text-2xl text-yellow-400 font-bold mb-4">
//                 Punch mari ne jajo
//               </div>
//             ) : (
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
//                 <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
//                   <div className="text-gray-400 text-sm mb-1 font-medium">Target</div>
//                   <div className="text-white text-lg font-bold">
//                     {isCustom ? `${baseHours}h (Custom)` : `${baseHours}h`}
//                   </div>
//                 </div>
//                 <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
//                   <div className="text-gray-400 text-sm mb-1 font-medium">Punch In</div>
//                   <div className="text-white text-lg font-bold">{formatTime(res.punchIn)}</div>
//                 </div>
//                 <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
//                   <div className="text-gray-400 text-sm mb-1 font-medium leading-tight">Ghare javano time</div>
//                   <div className="text-emerald-400 text-lg font-bold">{formatTime(res.theoreticalPunchOut)}</div>
//                 </div>
//                 <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
//                   <div className="text-gray-400 text-sm mb-1 font-medium">Total Break</div>
//                   <div className="text-white text-lg font-bold">{msToHMS(res.totalBreakMs)}</div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
      
//     <h1 className="text-lg text-center my-6 font-extrabold mb-2 bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
//        - વીર માંગડો (લવલી પાનવાળી ગલી)
//       </h1>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { 
  Briefcase, Pickaxe, Zap, Sun, SlidersHorizontal, Clock, 
  Timer, TrendingUp, Coffee, LogOut, Target, AlertCircle,
  CheckCircle2, Sparkles
} from "lucide-react";

export default function KekaTimer() {
  const [baseHours, setBaseHours] = useState(8);
  const [isCustom, setIsCustom] = useState(false);
  const [customHours, setCustomHours] = useState(7);
  const [inputLines, setInputLines] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleModeClick = (hours) => {
    setIsCustom(false);
    setBaseHours(hours);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setBaseHours(customHours);
  };

  const parseTimeToday = (timeStr) => {
    if (!timeStr || timeStr.toUpperCase().includes("MISSING")) return null;
    const cleaned = timeStr.trim().replace(/\s+/g, " ").toUpperCase();
    const today = new Date();
    const parts = cleaned.split(" ");
    if (parts.length < 2) return null;
    
    const time = parts[0];
    const meridian = parts[1];
    
    const timeParts = time.split(":").map(Number);
    if (timeParts.length < 2) return null;
    
    const h = timeParts[0];
    const m = timeParts[1];
    const s = timeParts[2] || 0;
    
    let hours = h % 12;
    if (meridian === "PM") hours += 12;
    
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, m, s);
  };

  const formatTime = (date) => {
    if (!date) return "-";
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const msToHMS = (ms) => {
    if (ms < 0) ms = 0;
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  };

  const calculateResult = () => {
    const lines = inputLines.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) {
      return { error: "Paste your KEKA timestamps to start tracking ⏰" };
    }

    const punchIn = parseTimeToday(lines[0]);
    if (!punchIn) {
      return { error: "Invalid time format. Check your input!" };
    }

    const targetWorkMs = baseHours * 60 * 60 * 1000;
    let totalBreakMs = 0;

    for (let i = 1; i < lines.length; i += 2) {
      const out = parseTimeToday(lines[i]);
      const inn = parseTimeToday(lines[i + 1]);
      if (out && inn) {
        totalBreakMs += inn - out;
      } else if (out && !inn) {
        totalBreakMs += nowTick - out;
      }
    }

    const theoreticalPunchOut = new Date(punchIn.getTime() + targetWorkMs + totalBreakMs);
    let workedMs = nowTick - punchIn.getTime() - totalBreakMs;
    if (workedMs < 0) workedMs = 0;

    const workedHours = workedMs / (1000 * 60 * 60);
    const progressPercent = Math.min((workedHours / baseHours) * 100, 100);

    let statusClass = "";
    let statusText = "";
    let statusIcon = null;
    let bgGradient = "";

    if (workedHours >= baseHours) {
      statusClass = "text-red-600 dark:text-red-400";
      statusText = "JALDI BHAGO! TIME PATI GYO!";
      statusIcon = <AlertCircle className="animate-pulse" size={32} />;
      bgGradient = "from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20";
    } else if (workedHours >= 9) {
      statusClass = "text-amber-600 dark:text-amber-400";
      statusText = "9 Hours Complete! 🎯";
      statusIcon = <CheckCircle2 size={32} />;
      bgGradient = "from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20";
    } else if (workedHours >= 8.5) {
      statusClass = "text-amber-600 dark:text-amber-400";
      statusText = "8.5 Hours Done! ⚡";
      statusIcon = <CheckCircle2 size={32} />;
      bgGradient = "from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20";
    } else {
      statusClass = "text-emerald-600 dark:text-emerald-400";
      statusText = "Hju var che, kam kro 💪";
      statusIcon = <Sparkles size={32} />;
      bgGradient = "from-emerald-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:to-cyan-500/20";
    }

    return {
      workedMs,
      workedHours,
      statusClass,
      statusText,
      statusIcon,
      bgGradient,
      progressPercent,
      targetWorkMs,
      totalBreakMs,
      punchIn,
      theoreticalPunchOut,
    };
  };

  const res = calculateResult();

  const modeButtons = [
    { hours: 8, icon: Briefcase, label: "Product", sub: "8h" },
    { hours: 8.5, icon: Pickaxe, label: "CF", sub: "8.5h" },
    { hours: 9, icon: Zap, label: "Full Day", sub: "9h" },
    { hours: 5, icon: Sun, label: "Half Day", sub: "5h" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-fadeIn">
      {/* HEADER CARD */}
      <div className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl shadow-xl dark:shadow-2xl border border-gray-200 dark:border-slate-700/50 mb-6">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-cyan-400/10 dark:bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-cyan-500/30">
            <Timer className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 dark:from-cyan-300 dark:via-blue-400 dark:to-indigo-500 bg-clip-text text-transparent tracking-tight">
            KEKA TIME METER
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-base md:text-lg flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-cyan-500 dark:text-cyan-400" />
            Know exactly when you can escape!
            <Sparkles size={16} className="text-cyan-500 dark:text-cyan-400" />
          </p>
        </div>
      </div>

      {/* MODE SELECTOR */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-slate-700/50 p-6 mb-6">
        <h3 className="text-gray-700 dark:text-slate-300 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Target size={16} className="text-cyan-500 dark:text-cyan-400" />
          Select Work Mode
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {modeButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = !isCustom && baseHours === btn.hours;
            return (
              <button
                key={btn.hours}
                onClick={() => handleModeClick(btn.hours)}
                className={`relative group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 border-2 ${
                  isActive
                    ? "bg-gradient-to-br from-cyan-500 to-indigo-600 border-cyan-400 shadow-lg shadow-cyan-500/40 scale-105"
                    : "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:border-cyan-500/50 hover:bg-gray-100 dark:hover:bg-slate-800 hover:scale-105"
                }`}
              >
                <Icon size={24} className={isActive ? "text-white" : "text-cyan-500 dark:text-cyan-400"} />
                <div className="text-center">
                  <div className={`font-bold text-sm ${isActive ? "text-white" : "text-gray-800 dark:text-slate-200"}`}>
                    {btn.label}
                  </div>
                  <div className={`text-xs ${isActive ? "text-cyan-100" : "text-gray-500 dark:text-slate-400"}`}>
                    {btn.sub}
                  </div>
                </div>
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Hours */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700/50">
          <button
            onClick={handleCustomClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-semibold border-2 ${
              isCustom
                ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 text-white shadow-lg shadow-purple-500/30"
                : "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-purple-500/50"
            }`}
          >
            <SlidersHorizontal size={16} /> Custom Hours
          </button>
          
          {isCustom && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-purple-500/30 rounded-xl px-3 py-1 animate-slideDown shadow-sm">
              <input
                type="number"
                step="0.25"
                min="1"
                value={customHours}
                onChange={(e) => {
                  setCustomHours(Number(e.target.value));
                  setBaseHours(Number(e.target.value));
                }}
                className="w-20 bg-transparent text-gray-900 dark:text-white text-center text-lg font-bold focus:outline-none"
              />
              <span className="text-gray-500 dark:text-slate-400 text-sm">hours</span>
            </div>
          )}
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-slate-700/50 p-6 mb-6">
        <label className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-semibold text-sm uppercase tracking-wider">
            <Clock size={16} className="text-cyan-500 dark:text-cyan-400" />
            KEKA Timestamps
          </span>
          {inputLines && (
            <button 
              onClick={() => setInputLines("")}
              className="text-xs text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors font-semibold"
            >
              Clear
            </button>
          )}
        </label>
        <div className="relative">
          <textarea
            value={inputLines}
            onChange={(e) => setInputLines(e.target.value)}
            placeholder={`9:20:36 AM\n1:01:21 PM\n1:44:46 PM\nMISSING`}
            className="w-full min-h-[160px] p-4 bg-gray-50 dark:bg-slate-950/60 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-cyan-700 dark:text-cyan-300 font-mono text-base resize-y focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all placeholder-gray-400 dark:placeholder-slate-600"
          />
          <div className="absolute top-3 right-3 px-2 py-1 bg-white dark:bg-slate-800/80 rounded-lg text-xs text-gray-500 dark:text-slate-400 font-mono border border-gray-200 dark:border-slate-700">
            {inputLines.split('\n').filter(l => l.trim()).length} lines
          </div>
        </div>
      </div>

      {/* RESULTS AREA */}
      {res.error ? (
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-slate-700/50 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
            <Clock size={36} className="text-gray-400 dark:text-slate-500" />
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-lg font-medium">{res.error}</p>
        </div>
      ) : (
        <div className={`relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-slate-700/50 p-6 md:p-8 animate-slideDown`}>
          {/* Status background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${res.bgGradient}`}></div>
          
          <div className="relative">
            {/* Worked Time */}
            <div className="text-center mb-6">
              <div className="text-gray-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
                <TrendingUp size={14} />
                Worked Till Now
              </div>
              <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-500 to-amber-600 dark:from-yellow-300 dark:to-amber-500 bg-clip-text text-transparent">
                {msToHMS(res.workedMs)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-600 dark:text-slate-400 mb-2 font-medium">
                <span>0h</span>
                <span className="font-bold">{res.progressPercent.toFixed(1)}%</span>
                <span>{baseHours}h</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden border border-gray-300 dark:border-slate-700">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    res.progressPercent >= 100
                      ? "bg-gradient-to-r from-red-500 to-orange-500"
                      : res.progressPercent >= 95
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                      : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                  }`}
                  style={{ width: `${res.progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Status Message */}
            <div className={`flex items-center justify-center gap-3 mb-8 ${res.statusClass}`}>
              {res.statusIcon}
              <div className="text-2xl md:text-3xl font-black text-center">
                {res.statusText}
              </div>
            </div>

            {res.workedHours >= baseHours ? (
              <div className="text-center bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 border-2 border-red-300 dark:border-red-500/30 rounded-2xl p-6">
                <LogOut className="mx-auto text-red-500 dark:text-red-400 mb-3 animate-bounce" size={40} />
                <div className="text-2xl md:text-3xl font-black text-red-600 dark:text-red-300">
                  Punch mari ne jajo! 🏃‍♂️💨
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={Target}
                  label="Target"
                  value={`${baseHours}h${isCustom ? ' (Custom)' : ''}`}
                  color="cyan"
                />
                <StatCard
                  icon={Briefcase}
                  label="Punch In"
                  value={formatTime(res.punchIn)}
                  color="blue"
                />
                <StatCard
                  icon={LogOut}
                  label="Ghare javano time"
                  value={formatTime(res.theoreticalPunchOut)}
                  color="emerald"
                  highlight
                />
                <StatCard
                  icon={Coffee}
                  label="Total Break"
                  value={msToHMS(res.totalBreakMs)}
                  color="amber"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-6 text-center">
        <div className="inline-block px-6 py-3 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm">
          <p className="text-sm font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-cyan-400 dark:to-indigo-500 bg-clip-text text-transparent">
            ✨ વીર માંગડો (લવલી પાનવાળી ગલી) ✨
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card Component ──────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = "cyan", highlight = false }) {
  // Light mode colors
  const lightColors = {
    cyan: "bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 text-cyan-700",
    blue: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 text-blue-700",
    emerald: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700",
    amber: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-amber-700",
  };
  
  // Dark mode colors
  const darkColors = {
    cyan: "dark:from-cyan-500/20 dark:to-blue-500/20 dark:border-cyan-500/30 dark:text-cyan-300",
    blue: "dark:from-blue-500/20 dark:to-indigo-500/20 dark:border-blue-500/30 dark:text-blue-300",
    emerald: "dark:from-emerald-500/20 dark:to-teal-500/20 dark:border-emerald-500/30 dark:text-emerald-300",
    amber: "dark:from-amber-500/20 dark:to-orange-500/20 dark:border-amber-500/30 dark:text-amber-300",
  };

  const iconColors = {
    cyan: "text-cyan-600 dark:text-cyan-300",
    blue: "text-blue-600 dark:text-blue-300",
    emerald: "text-emerald-600 dark:text-emerald-300",
    amber: "text-amber-600 dark:text-amber-300",
  };

  return (
    <div className={`relative overflow-hidden ${lightColors[color]} dark:bg-gradient-to-br ${darkColors[color]} backdrop-blur-sm border-2 rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg ${highlight ? 'ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}`}>
      <Icon size={18} className={iconColors[color]} />
      <div className="text-xs text-gray-600 dark:text-slate-400 font-semibold mt-2 mb-1 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-base md:text-lg font-black text-gray-900 dark:text-white leading-tight">
        {value}
      </div>
      {highlight && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}