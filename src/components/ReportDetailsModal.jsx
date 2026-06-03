import { Modal, Tag, Table, message } from "antd";
import { Clock, MessageSquare, Bug, CheckCircle, XCircle, FileText, Copy } from "lucide-react";

export default function ReportDetailsModal({ isOpen, onClose, snapshot }) {
  if (!snapshot) return null;

  const tasks = snapshot.tasks_data || [];
  const discussion = snapshot.discussion_data || {};
  const testing = snapshot.testing_data || {};

  const formatMin = (m) => {
    const total = Number(m) || 0;
    if (total <= 0) return "0m";
    const h = Math.floor(total / 60);
    const mins = total % 60;
    if (h > 0 && mins > 0) return `${h}h ${mins}m`;
    if (h > 0) return `${h}h`;
    return `${mins}m`;
  };

  const getTaskMinutes = (t) => {
    const h = Number(t.hrs) || 0;
    const m = Number(t.min) || 0;
    if (h > 0 || m > 0) return h * 60 + m;
    return t.total_min || t.totalMin || 0;
  };

  const handleCopyForTeams = async () => {
    try {
      let html = `<table border="1" style="border-collapse: collapse; font-family: sans-serif; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6; text-align: left;">
            <th style="padding: 8px; max-width: 500px; white-space: normal; word-wrap: break-word;">Task Description</th>
            <th style="padding: 8px;">Status</th>
            <th style="padding: 8px;">Type</th>
            <th style="padding: 8px;">Valid Time (hrs)</th>
            <th style="padding: 8px;">Invalid Time (hrs)</th>
          </tr>
        </thead>
        <tbody>`;

      let totalValid = 0;
      let totalInvalid = 0;

      tasks.forEach(t => {
        const totalMinutes = getTaskMinutes(t);
        const finalTime = Number((totalMinutes / 60).toFixed(2));
        const isValid = t.is_valid !== undefined ? t.is_valid : t.isValid;
        
        let validTime = 0;
        let invalidTime = 0;
        if (isValid === true) validTime = finalTime;
        else if (isValid === false) invalidTime = finalTime;

        totalValid += validTime;
        totalInvalid += invalidTime;

        // Clean up task text for HTML
        const safeTask = (t.task || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
        
        html += `
          <tr>
            <td style="padding: 8px; max-width: 500px; white-space: normal; word-wrap: break-word;">${safeTask}</td>
            <td style="padding: 8px;">${t.status || "-"}</td>
            <td style="padding: 8px;">${t.type || "-"}</td>
            <td style="padding: 8px;">${validTime.toFixed(2)}</td>
            <td style="padding: 8px;">${invalidTime.toFixed(2)}</td>
          </tr>
        `;
      });

      html += `
          <tr style="background-color: #f9fafb; font-weight: bold;">
            <td style="padding: 8px;" colspan="3">Total</td>
            <td style="padding: 8px;">${totalValid.toFixed(2)} hrs</td>
            <td style="padding: 8px;">${totalInvalid.toFixed(2)} hrs</td>
          </tr>
        </tbody>
      </table>`;

      // Fallback text
      let text = "Task Description\tStatus\tType\tValid Time (hrs)\tInvalid Time (hrs)\n";
      tasks.forEach(t => {
        const totalMinutes = getTaskMinutes(t);
        const finalTime = Number((totalMinutes / 60).toFixed(2));
        const isValid = t.is_valid !== undefined ? t.is_valid : t.isValid;
        let validTime = 0;
        let invalidTime = 0;
        if (isValid === true) validTime = finalTime;
        else if (isValid === false) invalidTime = finalTime;
        
        const singleLineTask = (t.task || "").replace(/\n/g, " ");
        text += `${singleLineTask}\t${t.status || "-"}\t${t.type || "-"}\t${validTime.toFixed(2)}\t${invalidTime.toFixed(2)}\n`;
      });
      text += `Total\t\t\t${totalValid.toFixed(2)} hrs\t${totalInvalid.toFixed(2)} hrs\n`;

      const blobHtml = new Blob([html], { type: "text/html" });
      const blobText = new Blob([text], { type: "text/plain" });
      const data = [new ClipboardItem({
        "text/html": blobHtml,
        "text/plain": blobText,
      })];

      await navigator.clipboard.write(data);
      message.success("Copied as rich table for Teams!");
    } catch (err) {
      console.error(err);
      message.error("Failed to copy table. Try a different browser.");
    }
  };

  const columns = [
    { title: "Task", dataIndex: "task", key: "task", render: (text, rec) => (
      <div>
        <p className="font-medium text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">{text}</p>
        {rec.cu_link || rec.cuLink ? (
          <a href={rec.cu_link || rec.cuLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline break-all mt-1 inline-block">
            {rec.cu_link || rec.cuLink}
          </a>
        ) : null}
      </div>
    )},
    { title: "Type", dataIndex: "type", key: "type", width: 120, render: (t) => t ? <Tag color="blue">{t}</Tag> : "-" },
    { title: "Status", dataIndex: "status", key: "status", width: 120, render: (s) => s ? <Tag color={s.toLowerCase() === 'done' ? 'success' : 'processing'}>{s}</Tag> : "-" },
    { title: "Time", key: "time", width: 90, render: (_, rec) => (
      <span className="font-semibold text-emerald-600">{formatMin(getTaskMinutes(rec))}</span>
    )},
    { title: "Valid", key: "valid", width: 70, align: 'center', render: (_, rec) => {
      const isValid = rec.is_valid !== undefined ? rec.is_valid : rec.isValid;
      if (isValid === true) return <CheckCircle size={16} className="text-emerald-500 mx-auto" />;
      if (isValid === false) return <XCircle size={16} className="text-red-500 mx-auto" />;
      return <span className="text-gray-300">-</span>;
    }}
  ];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700/50 pr-6">
          <div className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
            <FileText size={24} className="text-emerald-600" />
            Report Details: {snapshot.snapshot_date}
          </div>
          <button 
            onClick={handleCopyForTeams}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white rounded-lg text-sm font-semibold transition-colors border border-blue-200 dark:border-blue-800/50 hover:border-blue-600 dark:hover:border-blue-500 shadow-sm"
          >
            <Copy size={16} />
            Copy for Teams
          </button>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <div className="space-y-8 py-4 animate-fadeIn">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Time</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{snapshot.total_stats?.grandTotalTime || "0.00"} hrs</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Tasks Logged</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{tasks.length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Valid Time</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{snapshot.total_stats?.validTime?.toFixed(2) || "0.00"} hrs</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-100 dark:border-red-800/50">
            <p className="text-xs text-red-600 dark:text-red-400 uppercase font-semibold">Invalid Time</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{snapshot.total_stats?.invalidTime?.toFixed(2) || "0.00"} hrs</p>
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600" /> Tasks Breakdown
          </h3>
          <Table 
            dataSource={tasks} 
            columns={columns} 
            rowKey="id" 
            pagination={false}
            size="small"
            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
          />
        </div>

        {/* Discussion Section */}
        {(discussion.hrs > 0 || discussion.min > 0 || discussion.note) && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" /> Discussion
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{discussion.note || "General discussion"}</p>
              <div className="mt-3 flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold text-sm bg-white dark:bg-gray-800 inline-flex px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                <Clock size={14} />
                Time Spent: {formatMin((Number(discussion.hrs) || 0) * 60 + (Number(discussion.min) || 0))}
              </div>
            </div>
          </div>
        )}

        {/* Testing Section */}
        {(testing.testing_module || testing.test_case_scenario || (testing.bugs && testing.bugs.length > 0)) && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Bug size={18} className="text-purple-600 dark:text-purple-400" /> Testing
            </h3>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/50 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-100 dark:border-purple-800/50">
                  <span className="text-xs text-purple-400 uppercase font-bold block mb-1">Testing Module</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{testing.testing_module || "N/A"}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-100 dark:border-purple-800/50">
                  <span className="text-xs text-purple-400 uppercase font-bold block mb-1">Found Bug In</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{testing.bug_founded_module || "N/A"}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-100 dark:border-purple-800/50">
                <span className="text-xs text-purple-400 uppercase font-bold block mb-1">Test Case Scenario</span>
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{testing.test_case_scenario || "N/A"}</p>
              </div>

              {testing.bugs && testing.bugs.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs text-purple-400 uppercase font-bold mb-2 block">Bugs Logged ({testing.bugs.length})</span>
                  <ul className="space-y-2">
                    {testing.bugs.map((bug, i) => (
                      <li key={bug.id || i} className="text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-200 dark:border-purple-700/50">
                        {bug.description && <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">{bug.description}</p>}
                        {bug.url && (
                          <a href={bug.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline text-xs break-all flex items-center gap-1">
                            <span className="font-semibold">URL:</span> {bug.url}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
