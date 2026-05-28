// import { Copy, Check, Download, FileText } from "lucide-react";
// import { useState, useMemo } from "react";
// import { message } from "antd";

// export default function OutputFormat({ tasks, testing }) {
//   const [copied, setCopied] = useState(false);

//   const formatDecimalHours = (min) => {
//     if (!min || min <= 0) return "0";
//     return (min / 60).toFixed(2);
//   };

//   const formatMinutesDisplay = (min) => {
//     if (!min || min <= 0) return "0m";
//     const h = Math.floor(min / 60);
//     const m = min % 60;
//     if (h > 0 && m > 0) return `${h}h ${m}m`;
//     if (h > 0) return `${h}h`;
//     return `${m}m`;
//   };

//   const getCurrentDate = () => {
//     const d = new Date();
//     return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
//   };

//   const extractDescription = (task) => {
//     if (!task) return "";
//     const lines = task.split("\n");
//     return lines.length > 1 ? lines.slice(1).join("\n").trim() : task;
//   };

//   // ✅ FIXED: Wrapped in useMemo to prevent expensive string rebuilding on every render
//   const fullOutput = useMemo(() => {
//     const generateTasksOutput = () => {
//       const categoryMap = {
//         "Panel Bugs": "Panel Bugs",
//         "panel bugs": "Panel Bugs",
//         "NF": "NF",
//         "nf": "NF",
//         "internal": "internal",
//         "Internal": "internal",
//       };

//       const groups = {};
//       const uncategorized = [];

//       tasks.forEach((t) => {
//         if (!t.type) {
//           uncategorized.push(t);
//           return;
//         }
//         const normalized = categoryMap[t.type] || t.type;
//         if (!groups[normalized]) groups[normalized] = [];
//         groups[normalized].push(t);
//       });

//       let output = "";
//       let globalIdx = 1;

//       const orderedCategories = ["Panel Bugs", "NF", "internal"];

//       orderedCategories.forEach((cat) => {
//         const arr = groups[cat];
//         if (!arr || arr.length === 0) return;

//         const headerPrefix = cat === "Panel Bugs" ? "" : "* ";
//         const suffix = cat === "Panel Bugs" ? "" : " :";
//         output += `${headerPrefix}[${cat}] [${arr.length}]${suffix}\n\n`;

//         arr.forEach((t) => {
//           const cuLink = t.cuLink || "";
//           const status = t.status || "in progress";
//           const minDisplay = formatMinutesDisplay(t.totalMin || 0);
//           const hrDecimal = formatDecimalHours(t.finalTime || 0);
//           const desc = extractDescription(t.task);

//           output += `${globalIdx} . ${status} => ${cuLink} >> (${status}) >> ${minDisplay} >> ${hrDecimal}\n\n=> ${desc}\n\n`;
//           globalIdx++;
//         });
//       });

//       Object.entries(groups).forEach(([type, arr]) => {
//         if (orderedCategories.includes(type)) return;
//         if (!arr || arr.length === 0) return;

//         output += `[${type}] [${arr.length}]\n\n`;
//         arr.forEach((t) => {
//           const cuLink = t.cuLink || "";
//           const status = t.status || "in progress";
//           const minDisplay = formatMinutesDisplay(t.totalMin || 0);
//           const hrDecimal = formatDecimalHours(t.finalTime || 0);
//           const desc = extractDescription(t.task);

//           output += `${globalIdx} . ${status} => ${cuLink} >> (${status}) >> ${minDisplay} >> ${hrDecimal}\n\n=> ${desc}\n\n`;
//           globalIdx++;
//         });
//       });

//       return output.trim();
//     };

//     const generateTestingOutput = () => {
//       let output = `------------------------------------------------------------------------\n\n`;
//       output += `${testing.testingModule || "N/A"} -> testing on dev/beta >>> \n\n\n`;
//       output += `**Testing Module => ${testing.testingModule || "N/A"}\n\n`;
//       output += `and\n\n`;
//       output += `**Test case scenario => ${testing.testCaseScenario || "N/A"}\n\n`;
//       output += `and\n\n`;
//       output += `**bug founded module : - ${testing.bugFoundedModule || "N/A"}\n\n`;
//       output += `and\n\n`;

//       if (testing.bugs && testing.bugs.length > 0) {
//         testing.bugs.forEach((bug) => {
//           if (bug.description) {
//             output += `${bug.description}\n\nand\n\n`;
//           }
//         });
//       }

//       output += `Total Bug Count => ${testing.bugs?.length || 0}\n\n`;
//       output += `[Created Bungs Url]`;

//       if (testing.bugs && testing.bugs.length > 0) {
//         testing.bugs.forEach((bug, index) => {
//           if (bug.url) {
//             output += `   ${index + 1} . ${bug.url}`;
//             if (index < testing.bugs.length - 1) output += `\n`;
//           }
//         });
//       }

//       output += `\n\n------------------------------------------------------------------------`;
//       return output;
//     };

//     return `DATE: ${getCurrentDate()}\n\n${generateTasksOutput()}\n\n${generateTestingOutput()}`;
//   }, [tasks, testing]);

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

export default function OutputFormat({ tasks = [], testing = {} }) {
  const [copied, setCopied] = useState(false);

  const formatDecimalHours = (min) => {
    const total = Number(min) || 0;
    if (total <= 0) return "0";
    return (total / 60).toFixed(2);
  };

  const formatMinutesDisplay = (min) => {
    const total = Number(min) || 0;
    if (total <= 0) return "0m";

    const h = Math.floor(total / 60);
    const m = total % 60;

    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const formatOnlyMinutes = (min) => {
    const total = Number(min) || 0;
    return `${total}m`;
  };

  const getCurrentDate = () => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const extractDescription = (task = "") => {
    if (!task) return "";
    const lines = task.split("\n");
    return lines.length > 1 ? lines.slice(1).join("\n").trim() : task;
  };

  const extractClickupLink = (taskText = "", cuLink = "") => {
    if (cuLink) return cuLink;
    const match = String(taskText).match(
      /https?:\/\/app\.clickup\.com\/t\/[^\s\n]+/i
    );
    return match ? match[0] : "";
  };

  const getTaskMinutes = (t = {}) => {
    if (typeof t.totalMin === "number" && !Number.isNaN(t.totalMin)) {
      return t.totalMin;
    }

    if (
      typeof t.finalTime === "number" &&
      !Number.isNaN(t.finalTime) &&
      !t.hrs &&
      !t.min
    ) {
      return t.finalTime;
    }

    return (Number(t.hrs) || 0) * 60 + (Number(t.min) || 0);
  };

  const normalizeType = (type = "") => {
    const key = String(type).trim().toLowerCase();

    const map = {
      "panel bugs": "Panel Bugs",
      "panel bug": "Panel Bugs",
      nf: "NF",
      internal: "internal",
      "internal bug": "internal",
      "internal valid bug": "internal",
      "internal invalid/dev. reply bugs": "internal",
    };

    return map[key] || type;
  };

  const normalizePanelStatus = (status = "") => {
    const key = String(status).trim().toLowerCase();

    const map = {
      done: "Done",
      "dev replayed": "Dev Replied",
      "dev replied": "Dev Replied",
      mr: "MR Raised",
      "mr raised": "MR Raised",
      "in progress": "IN Progress",
      "debug and transfer": "Debug & Transfer",
      "debug & transfer": "Debug & Transfer",
      "not started": "Not Started",
      "on hold": "On Hold",
    };

    return map[key] || status;
  };

  const getPanelExtra = (task, normalizedStatus) => {
    // Done ke case me bug type dikhana
    if (normalizedStatus === "Done" && task.bugType) {
      return task.bugType;
    }

    // Debug & Transfer ke case me side dikhana: BE/FE/PHP
    // Iske liye task me panelSide / transferType / devType add kar sakte ho
    if (normalizedStatus === "Debug & Transfer") {
      return (
        task.panelSide ||
        task.transferType ||
        task.devType ||
        task.assignedSide ||
        ""
      );
    }

    return "";
  };

  const fullOutput = useMemo(() => {
    const generateTasksOutput = () => {
      const groups = {};
      const uncategorized = [];

      tasks.forEach((t) => {
        const normalizedType = normalizeType(t.type || "");

        if (!normalizedType) {
          uncategorized.push(t);
          return;
        }

        if (!groups[normalizedType]) groups[normalizedType] = [];
        groups[normalizedType].push(t);
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
          const totalMin = getTaskMinutes(t);
          const cuLink = extractClickupLink(t.task, t.cuLink);
          const status = t.status || "In progress";
          const minDisplay = formatMinutesDisplay(totalMin);
          const hrDecimal = formatDecimalHours(totalMin);
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
          const totalMin = getTaskMinutes(t);
          const cuLink = extractClickupLink(t.task, t.cuLink);
          const status = t.status || "In progress";
          const minDisplay = formatMinutesDisplay(totalMin);
          const hrDecimal = formatDecimalHours(totalMin);
          const desc = extractDescription(t.task);

          output += `${globalIdx} . ${status} => ${cuLink} >> (${status}) >> ${minDisplay} >> ${hrDecimal}\n\n=> ${desc}\n\n`;
          globalIdx++;
        });
      });

      if (uncategorized.length > 0) {
        output += `[Uncategorized] [${uncategorized.length}]\n\n`;

        uncategorized.forEach((t) => {
          const totalMin = getTaskMinutes(t);
          const cuLink = extractClickupLink(t.task, t.cuLink);
          const status = t.status || "In progress";
          const minDisplay = formatMinutesDisplay(totalMin);
          const hrDecimal = formatDecimalHours(totalMin);
          const desc = extractDescription(t.task);

          output += `${globalIdx} . ${status} => ${cuLink} >> (${status}) >> ${minDisplay} >> ${hrDecimal}\n\n=> ${desc}\n\n`;
          globalIdx++;
        });
      }

      return output.trim();
    };

    const generatePanelUpdateOutput = () => {
      const panelTasks = tasks.filter(
        (t) => normalizeType(t.type || "") === "Panel Bugs"
      );

      if (!panelTasks.length) return "";

      let output = `------------------------------------------------------------------------\n\n`;
      output += `Update Format\n\n`;

      const statusCounts = {};
      let validRevisionMin = 0;
      let validFunctionalityMin = 0;
      let invalidBugMin = 0;

      panelTasks.forEach((t) => {
        const status = normalizePanelStatus(t.status || "");
        const cuLink = extractClickupLink(t.task, t.cuLink);
        const totalMin = getTaskMinutes(t);
        const extra = getPanelExtra(t, status);
        const bugType = String(t.bugType || "").trim().toLowerCase();

        output += `${status} => ${cuLink || "-"} => ${formatMinutesDisplay(
          totalMin
        )}${extra ? ` (${extra})` : ""}\n`;

        statusCounts[status] = (statusCounts[status] || 0) + 1;

        if (bugType === "revision") {
          validRevisionMin += totalMin;
        } else if (bugType === "functionality") {
          validFunctionalityMin += totalMin;
        } else if (
          t.isValid === false ||
          [
            "invalid",
            "duplicate",
            "no changes needed",
            "native behavior",
            "unable to replicate",
          ].includes(bugType)
        ) {
          invalidBugMin += totalMin;
        }
      });

      const totalOrder = [
        "Done",
        "Dev Replied",
        "MR Raised",
        "IN Progress",
        "Debug & Transfer",
        "Not Started",
        "On Hold",
      ];

      const totalLine = totalOrder
        .filter((key) => statusCounts[key])
        .map((key) => `${key} = ${statusCounts[key]}`)
        .join(", ");

      output += `\nTotal\n`;
      output += `${totalLine || "No panel updates"}\n\n`;

      output += `Total time spent for Valid bugs Revision - ${formatOnlyMinutes(
        validRevisionMin
      )}\n`;
      output += `Total time spent for Valid bugs Functionality - ${formatOnlyMinutes(
        validFunctionalityMin
      )}\n`;
      output += `Total time spent for Invalid bugs - ${formatOnlyMinutes(
        invalidBugMin
      )}\n`;

      output += `\n------------------------------------------------------------------------`;

      return output;
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

    const normalOutput = generateTasksOutput();
    const panelOutput = generatePanelUpdateOutput();
    const testingOutput = generateTestingOutput();

    return `DATE: ${getCurrentDate()}\n\n${normalOutput}${
      panelOutput ? `\n\n${panelOutput}` : ""
    }\n\n${testingOutput}`;
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