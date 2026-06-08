import { Copy, Check, Download, FileText, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { message } from "antd";

export default function OutputFormat({ tasks = [], testing = {}, discussion = {}, mrIssue = {}, onRefresh }) {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      message.success("Output refreshed with latest data");
    }, 600);
  };

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
    const h = Number(t.hrs) || 0;
    const m = Number(t.min) || 0;

    if (h > 0 || m > 0) {
      return h * 60 + m;
    }

    if (typeof t.totalMin === "number" && !Number.isNaN(t.totalMin)) {
      return t.totalMin;
    }

    if (
      typeof t.finalTime === "number" &&
      !Number.isNaN(t.finalTime)
    ) {
      return t.finalTime;
    }

    return 0;
  };

  const normalizeType = (type = "") => {
    const key = String(type).trim().toLowerCase();

    const map = {
      "panel bugs": "Panel Bugs",
      "panel bug": "Panel Bugs",
      nf: "NF",
      internal: "Internal CU",
      "internal bug": "Internal CU",
      "internal valid bug": "Internal CU",
      "internal invalid/dev. reply bugs": "Internal CU",
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
    let side = "";
    if (normalizedStatus === "Debug & Transfer") {
      side = task.panelSide || task.transferType || task.devType || task.assignedSide || "";
    }
    const bug = task.bugType || task.bug_type || "";

    if (side && bug) return `${side}, ${bug}`;
    if (side) return side;
    if (bug) return bug;
    return "";
  };

  const { fullOutput, outputBlocks } = useMemo(() => {
    const blocks = [];

    blocks.push({ type: "header", text: `DATE: ${getCurrentDate()}` });

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

      const orderedCategories = ["Panel Bugs", "NF", "Internal CU"];

      const renderGroup = (catName, arr) => {
        if (!arr || arr.length === 0) return;

        let validCount = 0;
        let invalidCount = 0;
        arr.forEach(t => {
          const v = t.isValid !== undefined ? t.isValid : t.is_valid;
          if (v === true) validCount++;
          else if (v === false) invalidCount++;
        });

        const headerPrefix = catName === "Panel Bugs" ? "" : "* ";
        const suffix = catName === "Panel Bugs" ? "" : " :";

        blocks.push({
          type: "category",
          text: `${headerPrefix}[${catName}] [${arr.length}]${suffix}`
        });

        arr.forEach((t) => {
          const totalMin = getTaskMinutes(t);
          const cuLink = extractClickupLink(t.task, t.cuLink);
          const status = t.status || "In progress";
          const bugType = t.bugType || t.bug_type || "N/A";
          const minDisplay = formatMinutesDisplay(totalMin);
          const hrDecimal = formatDecimalHours(totalMin);
          const desc = extractDescription(t.task).replace(/\n/g, " ");

          let taskText = "";
          if (catName === "NF") {
            taskText = `[${bugType}] => [${cuLink || "-"}] => ${desc} => [${status}] => Time Spent: ${minDisplay} = ${hrDecimal}\n`;
          } else {
            taskText = `[${bugType}] => ${cuLink || "-"} => ${desc} => [${status}] => Time Spent: ${minDisplay} = ${hrDecimal}\n`;
          }

          blocks.push({
            type: "task",
            text: taskText
          });
        });
      };

      orderedCategories.forEach((cat) => {
        renderGroup(cat, groups[cat]);
      });

      Object.entries(groups).forEach(([type, arr]) => {
        if (orderedCategories.includes(type)) return;
        renderGroup(type, arr);
      });

      if (uncategorized.length > 0) {
        renderGroup("Uncategorized", uncategorized);
      }
    };

    const generateDiscussionOutput = () => {
      const h = Number(discussion?.hrs) || 0;
      const m = Number(discussion?.min) || 0;
      if (h === 0 && m === 0 && !discussion?.note) return;

      const totalMin = h * 60 + m;
      const minDisplay = formatMinutesDisplay(totalMin);
      const hrDecimal = formatDecimalHours(totalMin);
      const note = discussion?.note || "Discussion";

      blocks.push({ type: "discussion", text: `[Discussion]\n\n=> ${note} >> ${minDisplay} >> ${hrDecimal}` });
    };

    const generateMrIssueOutput = () => {
      const h = Number(mrIssue?.hrs) || 0;
      const m = Number(mrIssue?.min) || 0;
      if (h === 0 && m === 0 && !mrIssue?.note) return;

      const totalMin = h * 60 + m;
      const minDisplay = formatMinutesDisplay(totalMin);
      const hrDecimal = formatDecimalHours(totalMin);
      const note = mrIssue?.note || "MR Issues";

      blocks.push({ type: "mrIssue", text: `[MR Issue]\n\n=> ${note} >> ${minDisplay} >> ${hrDecimal}` });
    };

    const generatePanelUpdateOutput = () => {
      const panelTasks = tasks.filter(
        (t) => normalizeType(t.type || "") === "Panel Bugs"
      );

      if (!panelTasks.length) return;

      blocks.push({ type: "divider", text: `------------------------------------------------------------------------` });
      blocks.push({ type: "category", text: `Panel Bugs` });

      const statusCounts = {};
      let validRevisionMin = 0;
      let validFunctionalityMin = 0;
      let invalidBugMin = 0;
      let panelUpdatesText = [];

      panelTasks.forEach((t) => {
        const status = normalizePanelStatus(t.status || "");
        const cuLink = extractClickupLink(t.task, t.cuLink);
        const totalMin = getTaskMinutes(t);
        const extra = getPanelExtra(t, status);
        const bugType = String(t.bugType || "").trim().toLowerCase();

        panelUpdatesText.push(`${status} => ${cuLink || "-"} => ${formatMinutesDisplay(totalMin)}${extra ? ` (${extra})` : ""}`);
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

      blocks.push({ type: "panel_list", text: panelUpdatesText.join("\n") });

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

      let statsText = `Total\n${totalLine || "No panel updates"}\n\n`;
      statsText += `Total time spent for Valid bugs Revision - ${formatOnlyMinutes(validRevisionMin)}\n`;
      statsText += `Total time spent for Valid bugs Functionality - ${formatOnlyMinutes(validFunctionalityMin)}\n`;
      statsText += `Total time spent for Invalid bugs - ${formatOnlyMinutes(invalidBugMin)}`;

      blocks.push({ type: "panel_stats", text: statsText });
    };

    const generateTestingOutput = () => {
      blocks.push({ type: "divider", text: `------------------------------------------------------------------------` });
      blocks.push({ type: "testing_header", text: `${testing.testingModule || "N/A"} -> testing on dev/beta >>> \n\n\n**Testing Module => ${testing.testingModule || "N/A"}\n\nand\n\n**Test case scenario => ${testing.testCaseScenario || "N/A"}\n\nand\n\n**bug founded module : - ${testing.bugFoundedModule || "N/A"}` });

      if (testing.bugs && testing.bugs.length > 0) {
        testing.bugs.forEach((bug) => {
          if (bug.description) {
            blocks.push({ type: "testing_bug", text: `and\n\n${bug.description}` });
          }
        });
      }

      blocks.push({ type: "testing_stats", text: `and\n\nTotal Bug Count => ${testing.bugs?.length || 0}\n\n[Created Bungs Url]` });

      if (testing.bugs && testing.bugs.length > 0) {
        let urlsText = testing.bugs.map((bug, index) => {
          if (bug.url) {
            return `   ${index + 1} . ${bug.url}`;
          }
          return null;
        }).filter(Boolean).join("\n");
        if (urlsText) {
          blocks.push({ type: "testing_urls", text: urlsText });
        }
      }

      blocks.push({ type: "divider", text: `------------------------------------------------------------------------` });
    };

    generateTasksOutput();
    generateDiscussionOutput();
    generateMrIssueOutput();
    generatePanelUpdateOutput();
    generateTestingOutput();

    const fullText = blocks.map(b => b.text).join('\n\n');

    return { fullOutput: fullText, outputBlocks: blocks };
  }, [tasks, testing, discussion]);

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullOutput);
    setCopied(true);
    message.success("Full output copied to clipboard");
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            <Download size={14} />
            Download
          </button>

          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${copied
              ? "bg-green-500 text-white"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto font-mono text-gray-800 dark:text-gray-100 transition-colors duration-300">
          {outputBlocks.map((block, i) => (
            <div
              key={i}
              className={`relative group px-4 py-2 hover:bg-emerald-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0 ${block.type === 'divider' ? 'bg-gray-100 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500' : ''} ${block.type === 'category' ? 'bg-gray-100 dark:bg-gray-700 font-bold text-gray-700 dark:text-gray-200' : ''}`}
            >
              {/* Copy button that shows on hover */}
              {block.type !== 'divider' && block.type !== 'header' && (
                <button
                  onClick={() => handleCopyText(block.text)}
                  title="Copy this section"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-600 border border-emerald-200 dark:border-gray-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white p-1.5 rounded-md shadow-sm transition-all duration-200"
                >
                  <Copy size={14} />
                </button>
              )}

              <div className="pr-8">{block.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}