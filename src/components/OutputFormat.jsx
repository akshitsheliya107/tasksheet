// import { Copy, Check, Download, FileText } from "lucide-react";
// import { useState } from "react";
// import { message } from "antd";

// export default function OutputFormat({ tasks, testing }) {
//   const [copied, setCopied] = useState(false);

//   // Format minutes to decimal hours (e.g., 70 min -> 1.16)
//   const formatDecimalHours = (min) => {
//     if (!min || min <= 0) return "0";
//     return (min / 60).toFixed(2);
//   };

//   // Format minutes for display (e.g., 50m, 1h 10m)
//   const formatMinutesDisplay = (min) => {
//     if (!min || min <= 0) return "0m";
//     const h = Math.floor(min / 60);
//     const m = min % 60;
//     if (h > 0 && m > 0) return `${h}h ${m}m`;
//     if (h > 0) return `${h}h`;
//     return `${m}m`;
//   };

//   // Get current date in DD/M/YYYY format
//   const getCurrentDate = () => {
//     const d = new Date();
//     return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
//   };

//   // Extract description lines after the first line
//   const extractDescription = (task) => {
//     if (!task) return "";
//     const lines = task.split("\n");
//     return lines.length > 1 ? lines.slice(1).join("\n").trim() : task;
//   };

//   const generateTasksOutput = () => {
//     // Define known category mappings
//     const categoryMap = {
//       "Panel Bugs": "Panel Bugs",
//       "panel bugs": "Panel Bugs",
//       "NF": "NF",
//       "nf": "NF",
//       "internal": "internal",
//       "Internal": "internal",
//     };

//     // Group tasks by normalized category
//     const groups = {};
//     const uncategorized = [];

//     tasks.forEach((t) => {
//       if (!t.type) {
//         uncategorized.push(t);
//         return;
//       }
//       const normalized = categoryMap[t.type] || t.type;
//       if (!groups[normalized]) groups[normalized] = [];
//       groups[normalized].push(t);
//     });

//     let output = "";
//     let globalIdx = 1;

//     // Render known categories in order: Panel Bugs, NF, internal
//     const orderedCategories = ["Panel Bugs", "NF", "internal"];

//     orderedCategories.forEach((cat) => {
//       const arr = groups[cat];
//       if (!arr || arr.length === 0) return;

//       const headerPrefix = cat === "Panel Bugs" ? "" : "* ";
//       const suffix = cat === "Panel Bugs" ? "" : " :";
//       output += `${headerPrefix}[${cat}] [${arr.length}]${suffix}\n\n`;

//       arr.forEach((t) => {
//         const cuLink = t.cuLink || "";
//         const status = t.status || "in progress";
//         const minDisplay = formatMinutesDisplay(t.totalMin || 0);
//         const hrDecimal = formatDecimalHours(t.finalTime || 0);
//         const desc = extractDescription(t.task);

//         output += `${globalIdx} . ${status} => ${cuLink} >> (${status}) >> ${minDisplay} >> ${hrDecimal}\n\n=> ${desc}\n\n`;
//         globalIdx++;
//       });
//     });

//     // Render any remaining uncategorized or unknown types
//     Object.entries(groups).forEach(([type, arr]) => {
//       if (orderedCategories.includes(type)) return;
//       if (!arr || arr.length === 0) return;

//       output += `[${type}] [${arr.length}]\n\n`;
//       arr.forEach((t) => {
//         const cuLink = t.cuLink || "";
//         const status = t.status || "in progress";
//         const minDisplay = formatMinutesDisplay(t.totalMin || 0);
//         const hrDecimal = formatDecimalHours(t.finalTime || 0);
//         const desc = extractDescription(t.task);

//         output += `${globalIdx} . ${status} => ${cuLink} >> (${status}) >> ${minDisplay} >> ${hrDecimal}\n\n=> ${desc}\n\n`;
//         globalIdx++;
//       });
//     });

//     return output.trim();
//   };

//   const generateTestingOutput = () => {
//     const testingTime = formatDecimalHours(
//       (testing.testingTime?.hrs || 0) * 60 + (testing.testingTime?.min || 0)
//     );

//     let output = `------------------------------------------------------------------------\n\n`;
//     output += `${testing.testingModule || "N/A"} -> testing on dev/beta >>> \n\n\n`;
//     output += `**Testing Module => ${testing.testingModule || "N/A"}\n\n`;
//     output += `and\n\n`;
//     output += `**Test case scenario => ${testing.testCaseScenario || "N/A"}\n\n`;
//     output += `and\n\n`;
//     output += `**bug founded module : - ${testing.bugFoundedModule || "N/A"}\n\n`;
//     output += `and\n\n`;

//     // List bug descriptions
//     if (testing.bugs && testing.bugs.length > 0) {
//       testing.bugs.forEach((bug) => {
//         if (bug.description) {
//           output += `${bug.description}\n\nand\n\n`;
//         }
//       });
//     }

//     output += `Total Bug Count => ${testing.bugs?.length || 0}\n\n`;
//     output += `[Created Bungs Url]`;

//     if (testing.bugs && testing.bugs.length > 0) {
//       testing.bugs.forEach((bug, index) => {
//         if (bug.url) {
//           output += `   ${index + 1} . ${bug.url}`;
//           if (index < testing.bugs.length - 1) output += `\n`;
//         }
//       });
//     }

//     output += `\n\n------------------------------------------------------------------------`;

//     return output;
//   };

//   const fullOutput = `DATE: ${getCurrentDate()}\n\n${generateTasksOutput()}\n\n${generateTestingOutput()}`;

//   const handleCopy = () => {
//     navigator.clipboard.writeText(fullOutput);
//     setCopied(true);
//     message.success("Copied to clipboard");
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleDownload = () => {
//     const blob = new Blob([fullOutput], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `daily-report-${new Date().toISOString().split("T")[0]}.txt`;
//     a.click();
//     URL.revokeObjectURL(url);
//     message.success("Report downloaded");
//   };

//   return (
//     <div className="bg-gray-800 rounded-lg overflow-hidden">
//       <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <FileText size={20} className="text-emerald-400" />
//           <div>
//             <h3 className="font-semibold text-white">Generated Output</h3>
//             <p className="text-xs text-gray-400">
//               Copy or download your report
//             </p>
//           </div>
//         </div>
//         <div className="flex gap-2">
//           <button
//             onClick={handleDownload}
//             className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
//           >
//             <Download size={14} />
//             Download
//           </button>
//           <button
//             onClick={handleCopy}
//             className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
//               copied
//                 ? "bg-green-500 text-white"
//                 : "bg-emerald-600 text-white hover:bg-emerald-700"
//             }`}
//           >
//             {copied ? <Check size={14} /> : <Copy size={14} />}
//             {copied ? "Copied!" : "Copy"}
//           </button>
//         </div>
//       </div>
//       <div className="p-4">
//         <pre className="bg-gray-900 p-4 rounded text-gray-300 text-sm whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto font-mono">
//           {fullOutput}
//         </pre>
//       </div>
//     </div>
//   );
// }

import { Copy, Check, Download, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { message } from "antd";

export default function OutputFormat({ tasks, testing }) {
  const [copied, setCopied] = useState(false);

  const formatDecimalHours = (min) => {
    if (!min || min <= 0) return "0";
    return (min / 60).toFixed(2);
  };

  const formatMinutesDisplay = (min) => {
    if (!min || min <= 0) return "0m";
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const getCurrentDate = () => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const extractDescription = (task) => {
    if (!task) return "";
    const lines = task.split("\n");
    return lines.length > 1 ? lines.slice(1).join("\n").trim() : task;
  };

  // ✅ FIXED: Wrapped in useMemo to prevent expensive string rebuilding on every render
  const fullOutput = useMemo(() => {
    const generateTasksOutput = () => {
      const categoryMap = {
        "Panel Bugs": "Panel Bugs",
        "panel bugs": "Panel Bugs",
        "NF": "NF",
        "nf": "NF",
        "internal": "internal",
        "Internal": "internal",
      };

      const groups = {};
      const uncategorized = [];

      tasks.forEach((t) => {
        if (!t.type) {
          uncategorized.push(t);
          return;
        }
        const normalized = categoryMap[t.type] || t.type;
        if (!groups[normalized]) groups[normalized] = [];
        groups[normalized].push(t);
      });

      let output = "";
      let globalIdx = 1;

      const orderedCategories = ["Panel Bugs", "NF", "internal"];

      orderedCategories.forEach((cat) => {
        const arr = groups[cat];
        if (!arr || arr.length === 0) return;

        const headerPrefix = cat === "Panel Bugs" ? "" : "* ";
        const suffix = cat === "Panel Bugs" ? "" : " :";
        output += `${headerPrefix}[${cat}] [${arr.length}]${suffix}\n\n`;

        arr.forEach((t) => {
          const cuLink = t.cuLink || "";
          const status = t.status || "in progress";
          const minDisplay = formatMinutesDisplay(t.totalMin || 0);
          const hrDecimal = formatDecimalHours(t.finalTime || 0);
          const desc = extractDescription(t.task);

          output += `${globalIdx} . ${status} => ${cuLink} >> (${status}) >> ${minDisplay} >> ${hrDecimal}\n\n=> ${desc}\n\n`;
          globalIdx++;
        });
      });

      Object.entries(groups).forEach(([type, arr]) => {
        if (orderedCategories.includes(type)) return;
        if (!arr || arr.length === 0) return;

        output += `[${type}] [${arr.length}]\n\n`;
        arr.forEach((t) => {
          const cuLink = t.cuLink || "";
          const status = t.status || "in progress";
          const minDisplay = formatMinutesDisplay(t.totalMin || 0);
          const hrDecimal = formatDecimalHours(t.finalTime || 0);
          const desc = extractDescription(t.task);

          output += `${globalIdx} . ${status} => ${cuLink} >> (${status}) >> ${minDisplay} >> ${hrDecimal}\n\n=> ${desc}\n\n`;
          globalIdx++;
        });
      });

      return output.trim();
    };

    const generateTestingOutput = () => {
      let output = `------------------------------------------------------------------------\n\n`;
      output += `${testing.testingModule || "N/A"} -> testing on dev/beta >>> \n\n\n`;
      output += `**Testing Module => ${testing.testingModule || "N/A"}\n\n`;
      output += `and\n\n`;
      output += `**Test case scenario => ${testing.testCaseScenario || "N/A"}\n\n`;
      output += `and\n\n`;
      output += `**bug founded module : - ${testing.bugFoundedModule || "N/A"}\n\n`;
      output += `and\n\n`;

      if (testing.bugs && testing.bugs.length > 0) {
        testing.bugs.forEach((bug) => {
          if (bug.description) {
            output += `${bug.description}\n\nand\n\n`;
          }
        });
      }

      output += `Total Bug Count => ${testing.bugs?.length || 0}\n\n`;
      output += `[Created Bungs Url]`;

      if (testing.bugs && testing.bugs.length > 0) {
        testing.bugs.forEach((bug, index) => {
          if (bug.url) {
            output += `   ${index + 1} . ${bug.url}`;
            if (index < testing.bugs.length - 1) output += `\n`;
          }
        });
      }

      output += `\n\n------------------------------------------------------------------------`;
      return output;
    };

    return `DATE: ${getCurrentDate()}\n\n${generateTasksOutput()}\n\n${generateTestingOutput()}`;
  }, [tasks, testing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullOutput);
    setCopied(true);
    message.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("Report downloaded");
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-emerald-400" />
          <div>
            <h3 className="font-semibold text-white">Generated Output</h3>
            <p className="text-xs text-gray-400">
              Copy or download your report
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            <Download size={14} />
            Download
          </button>
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
              copied
                ? "bg-green-500 text-white"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="p-4">
        <pre className="bg-gray-900 p-4 rounded text-gray-300 text-sm whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto font-mono">
          {fullOutput}
        </pre>
      </div>
    </div>
  );
}