import { Copy, Check, Download, FileText } from "lucide-react";
import { useState } from "react";
import { message } from "antd";

export default function OutputFormat({ tasks, testing, discussion }) {
  const [copied, setCopied] = useState(false);

  const extractCULink = (task) => {
    const match = task?.match(/https:\/\/app\.clickup\.com\/t\/[^\s]+/);
    return match ? match[0] : "";
  };

  const extractTitle = (task) => {
    if (!task) return "";
    const lines = task.split("\n");
    return lines.length > 1 ? lines.slice(1).join("\n").trim() : task;
  };

  const generateTasksOutput = () => {
    return tasks
      .filter((t) => t.task && t.finalTime > 0)
      .map((t) => {
        const cuLink = extractCULink(t.task);
        const title = extractTitle(t.task);
        const taskType = t.type || "Task";
        return `${taskType}: ${cuLink} -> ${t.status || "In progress"} - ${
          t.finalTime
        }\n${title}`;
      })
      .join("\n\n");
  };

  const generateTestingOutput = () => {
    const testingTime = (
      ((testing.testingTime?.hrs || 0) * 60 + (testing.testingTime?.min || 0)) /
      60
    ).toFixed(2);

    let output = `**Testing Module => ${
      testing.testingModule || "N/A"
    } => ${testingTime}

**Test case scenario => ${testing.testCaseScenario || "N/A"}

**Bug founded module : ${testing.bugFoundedModule || "N/A"}

`;

    testing.bugs?.forEach((bug) => {
      if (bug.description) {
        output += `${bug.description}\n\n`;
      }
    });

    output += `Total Bug Count => ${testing.bugs?.length || 0}

[Created Bugs Url]`;

    testing.bugs?.forEach((bug, index) => {
      if (bug.url) {
        output += `\n  ${index + 1}. ${bug.url}`;
      }
    });

    return output;
  };

  const generateDiscussionOutput = () => {
    const discussionTime = (
      ((discussion.hrs || 0) * 60 + (discussion.min || 0)) /
      60
    ).toFixed(2);
    return `**Discussion Time => ${discussionTime} hrs\n${
      discussion.note || ""
    }`;
  };

  const fullOutput = `════════════════════════════════════════════
              📋 DAILY REPORT
════════════════════════════════════════════

📌 TASKS
────────────────────────────────────────────

${generateTasksOutput() || "No tasks recorded"}

────────────────────────────────────────────

🧪 TESTING
────────────────────────────────────────────

${generateTestingOutput()}

────────────────────────────────────────────

💬 DISCUSSION
────────────────────────────────────────────

${generateDiscussionOutput()}

════════════════════════════════════════════`;

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
