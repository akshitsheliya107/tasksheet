import { useState, useEffect } from "react";
import { Briefcase, Pickaxe, Zap, Sun, SlidersHorizontal, Clock } from "lucide-react";

export default function KekaTimer() {
  const [baseHours, setBaseHours] = useState(8);
  const [isCustom, setIsCustom] = useState(false);
  const [customHours, setCustomHours] = useState(7);
  const [inputLines, setInputLines] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    // Update the "now" time every second to keep the timer live
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
      return { error: "utaval che ?" };
    }

    const punchIn = parseTimeToday(lines[0]);
    if (!punchIn) {
      return { error: "Invalid time format" };
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

    let statusClass = "";
    let statusText = "";

    if (workedHours >= baseHours) {
      statusClass = "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse";
      statusText = "JALDI BHAGO! TIME PATI GYO!";
    } else if (workedHours >= 9) {
      statusClass = "text-amber-500";
      statusText = "9 pura!";
    } else if (workedHours >= 8.5) {
      statusClass = "text-amber-500";
      statusText = "8.5 pura!";
    } else {
      statusClass = "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]";
      statusText = "hju var che kam kro ";
    }

    return {
      workedMs,
      workedHours,
      statusClass,
      statusText,
      targetWorkMs,
      totalBreakMs,
      punchIn,
      theoreticalPunchOut,
    };
  };

  const res = calculateResult();

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-gray-100 font-sans animate-fadeIn">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
          KEKA TIME METER
        </h1>
        <p className="text-gray-400 text-lg">Know exactly when you can escape! 🚀</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          onClick={() => handleModeClick(8)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
            !isCustom && baseHours === 8
              ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
              : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <Briefcase size={18} /> Product (8h)
        </button>
        <button
          onClick={() => handleModeClick(8.5)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
            !isCustom && baseHours === 8.5
              ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
              : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <Pickaxe size={18} /> CF (8.5h)
        </button>
        <button
          onClick={() => handleModeClick(9)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
            !isCustom && baseHours === 9
              ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
              : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <Zap size={18} /> 9 Hours
        </button>
        <button
          onClick={() => handleModeClick(5)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
            !isCustom && baseHours === 5
              ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
              : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <Sun size={18} /> Half Day
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {isCustom && (
          <input
            type="number"
            step="0.25"
            min="1"
            value={customHours}
            onChange={(e) => {
              setCustomHours(Number(e.target.value));
              setBaseHours(Number(e.target.value));
            }}
            className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-center text-white w-32 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        )}
        <button
          onClick={handleCustomClick}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-semibold border ${
            isCustom
              ? "bg-cyan-500 border-cyan-400 text-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] transform -translate-y-1"
              : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <SlidersHorizontal size={18} /> Custom for early leave
        </button>
      </div>

      <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700 shadow-inner mb-8">
        <label className="flex items-center gap-2 text-gray-300 font-medium mb-3">
          <Clock size={16} /> Paste KEKA Time stamps Here:
        </label>
        <textarea
          value={inputLines}
          onChange={(e) => setInputLines(e.target.value)}
          placeholder={`Example:\n9:20:36 AM\n1:01:21 PM\n1:44:46 PM\nMISSING`}
          className="w-full min-h-[140px] p-4 bg-gray-900/50 border border-gray-600 rounded-xl text-gray-100 font-mono text-base resize-y focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
        />
      </div>

      <div className="text-center">
        {res.error ? (
          <div className="text-red-400 text-xl font-medium mt-4">{res.error}</div>
        ) : (
          <div className="animate-slideDown">
            <div className="text-3xl text-yellow-400 font-bold tracking-wide mb-4">
              Worked Till Now : {msToHMS(res.workedMs)}
            </div>
            
            <div className={`text-4xl md:text-5xl font-extrabold mb-6 ${res.statusClass}`}>
              {res.statusText}
            </div>

            {res.workedHours >= baseHours ? (
              <div className="text-2xl text-yellow-400 font-bold mb-4">
                Punch mari ne jajo
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                  <div className="text-gray-400 text-sm mb-1 font-medium">Target</div>
                  <div className="text-white text-lg font-bold">
                    {isCustom ? `${baseHours}h (Custom)` : `${baseHours}h`}
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                  <div className="text-gray-400 text-sm mb-1 font-medium">Punch In</div>
                  <div className="text-white text-lg font-bold">{formatTime(res.punchIn)}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                  <div className="text-gray-400 text-sm mb-1 font-medium leading-tight">Ghare javano time</div>
                  <div className="text-emerald-400 text-lg font-bold">{formatTime(res.theoreticalPunchOut)}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                  <div className="text-gray-400 text-sm mb-1 font-medium">Total Break</div>
                  <div className="text-white text-lg font-bold">{msToHMS(res.totalBreakMs)}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
    <h1 className="text-lg text-center my-6 font-extrabold mb-2 bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
       - વીર માંગડો (લવલી પાનવાળી ગલી)
      </h1>
    </div>
  );
}
