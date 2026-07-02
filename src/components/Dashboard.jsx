import { useState, useMemo, useEffect } from "react";
import { Download, Clock as ClockIcon } from "lucide-react";
import { timeAgo } from "../utils/timeUtils";
import { clickupConfigAPI } from "../services/api";
import ClickupFetchModal from "./ClickupFetchModal";
import {
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Save,
  FileText,
  MessageSquare,
  Bug,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Modal, message, Alert, Button, Collapse } from "antd";
import TimeEntryRow from "./TimeEntryRow";
import TestingSection from "./TestingSection";
import OutputFormat from "./OutputFormat";
import AddTaskModal from "./AddTaskModal";

export default function Dashboard({
  tasks,
  discussion,
  mrIssue,
  testing,
  typeOptions,
    isLoading = false, 
  statusOptions,
  bugTypeOptions,
  onAddTypeOption,
  onDeleteTypeOption,
  onAddStatusOption,
  onDeleteStatusOption,
  onAddBugTypeOption,
  onDeleteBugTypeOption,
  onCreateTask,
  onCreateDefaultTasks,
  onUpdateTask,
  onDeleteTask,
  onDeleteAllTasks,
  onUpdateDiscussion,
  onUpdateMrIssue,
  onUpdateTesting,
  onAddBug,
  onUpdateBug,
  onDeleteBug,
  onRefresh,
  onSaveSnapshot,
  theme = "emerald",
  onViewChange,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(true);
  const [showMrIssue, setShowMrIssue] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showClickupModal, setShowClickupModal] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [config, setConfig] = useState(null);
  const [, forceUpdate] = useState(0);

  // Load last sync time
  useEffect(() => {
    const loadSyncTime = async () => {
      try {
        const cfg = await clickupConfigAPI.get();
        setConfig(cfg);
        setLastSyncedAt(cfg.lastSyncedAt);
      } catch (err) {
        console.error(err);
      }
    };
    loadSyncTime();
  }, [tasks]); // re-fetch when tasks change

  // Update relative time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

useEffect(() => {
  // Loading chal rahi hai to wait karo
  if (isLoading) return;
  
  if (!initialized) {
    setInitialized(true);
    if (tasks.length === 0) {
      onCreateDefaultTasks(10);
    }
  }
}, [initialized, isLoading, tasks.length, onCreateDefaultTasks]);

  const tasksStats = useMemo(() => {
    return tasks.reduce(
      (acc, t) => {
        const h = Number(t.hrs) || 0;
        const m = Number(t.min) || 0;
        let totalMin = 0;

        if (h > 0 || m > 0) {
          totalMin = h * 60 + m;
        } else {
          totalMin = t.totalMin || t.total_min || 0;
        }

        const finalTime = Number((totalMin / 60).toFixed(2));
        const isValid = t.is_valid !== undefined ? t.is_valid : t.isValid;

        let validTime = 0;
        let invalidTime = 0;

        if (isValid === true) {
          validTime = finalTime;
        } else if (isValid === false) {
          invalidTime = finalTime;
        }

        acc.totalMin += totalMin;
        acc.validTime += validTime;
        acc.invalidTime += invalidTime;

        if (t.type && typeof t.type === "string") {
          const type = t.type.toLowerCase();
          let category = null;
          if (type.includes("panel")) category = "panel";
          else if (type.includes("internal")) category = "internal";
          else if (type === "nf") category = "nf";

          if (category) {
            acc.breakdown[category].count += 1;

            if (isValid === true) {
              acc.breakdown[category].validCount += 1;
              acc.breakdown[category].validTime += validTime;
            } else if (isValid === false) {
              acc.breakdown[category].invalidCount += 1;
              acc.breakdown[category].invalidTime += invalidTime;
            }
          }
        }

        return acc;
      },
      {
        totalMin: 0,
        validTime: 0,
        invalidTime: 0,
        breakdown: {
          panel: { count: 0, validCount: 0, validTime: 0, invalidCount: 0, invalidTime: 0 },
          internal: { count: 0, validCount: 0, validTime: 0, invalidCount: 0, invalidTime: 0 },
          nf: { count: 0, validCount: 0, validTime: 0, invalidCount: 0, invalidTime: 0 },
        }
      }
    );
  }, [tasks]);

  const discussionStats = useMemo(() => {
    const totalMin = (discussion?.hrs || 0) * 60 + (discussion?.min || 0);
    return { totalMin, finalTime: (totalMin / 60).toFixed(2) };
  }, [discussion]);

  const mrIssueStats = useMemo(() => {
    const totalMin = (mrIssue?.hrs || 0) * 60 + (mrIssue?.min || 0);
    return { totalMin, finalTime: (totalMin / 60).toFixed(2) };
  }, [mrIssue]);

  const testingStats = useMemo(() => {
    const totalMin =
      (testing.testingTime?.hrs || 0) * 60 + (testing.testingTime?.min || 0);
    return { totalMin, finalTime: (totalMin / 60).toFixed(2) };
  }, [testing]);

  const grandTotalMin =
    tasksStats.totalMin + discussionStats.totalMin + mrIssueStats.totalMin + testingStats.totalMin;
  const grandTotalTime = (grandTotalMin / 60).toFixed(2);

  const handleDeleteTask = (id) => {
    Modal.confirm({
      title: "Delete Task",
      content:
        "Are you sure you want to delete this task? This action cannot be undone.",
      okText: "Yes, Delete",
      cancelText: "Cancel",
      okType: "danger",
      centered: true,
      onOk: async () => {
        await onDeleteTask(id);
        message.success("Task deleted successfully");
      },
    });
  };

  const handleDeleteAllTasks = () => {
    Modal.confirm({
      title: "Delete All Tasks",
      content: "Are you sure you want to delete all tasks? This action cannot be undone.",
      okText: "Yes, Delete All",
      cancelText: "Cancel",
      okType: "danger",
      centered: true,
      onOk: async () => {
        try {
          await onDeleteAllTasks();
          
          // Clear discussion
          if (onUpdateDiscussion) {
            onUpdateDiscussion({ hrs: 0, min: 0, note: "" });
          }
          
          // Clear MR Issue
          if (onUpdateMrIssue) {
            onUpdateMrIssue({ hrs: 0, min: 0, note: "" });
          }
          
          // Clear testing
          if (onUpdateTesting) {
            onUpdateTesting({ testingTime: { hrs: 0, min: 0 } });
          }

          message.success("All tasks and times deleted successfully");
        } catch (error) {
          message.error("Failed to delete tasks");
        }
      },
    });
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      await onSaveSnapshot({
        tasks,
        discussion,
        mrIssue,
        testing,
        stats: {
          grandTotalMin,
          grandTotalTime: Number(grandTotalTime),
          validTime: tasksStats.validTime,
          invalidTime: tasksStats.invalidTime,
        },
      });
      message.success("Report saved to history");
    } catch (error) {
      message.error("Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {config && !config.reportName && (
        <Alert
          message={
            <span className="font-semibold text-blue-800 dark:text-blue-200">
              New Report Format Update
            </span>
          }
          description={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
              <span className="text-blue-700 dark:text-blue-300">
                Please enter your Name in Settings to apply it to your generated output headers.
              </span>
              <button 
                onClick={() => onViewChange && onViewChange("clickup_settings")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap self-start sm:self-auto"
              >
                Go to Settings
              </button>
            </div>
          }
          type="info"
          showIcon
          className="rounded-xl shadow-sm border-blue-200  dark:border-blue-800/50 dark:bg-blue-900/20"
        />
      )}

      <div className="bg-[#FFFFFF] dark:bg-[#242424] backdrop-blur-md rounded-xl shadow-sm border border-gray-200 dark:border-[#333333] p-6 transition-all duration-300 hover:shadow-md mt-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              Daily Time Tracking
            </h1>
            <div className="flex flex-col gap-1">
              <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                <Calendar size={14} />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {lastSyncedAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                  <ClockIcon size={11} />
                  <span>ClickUp synced {timeAgo(lastSyncedAt)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-gray-300 dark:border-gray-600 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={() => setShowClickupModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d8b4fe] text-[#4c1d95] rounded-full text-sm font-semibold hover:bg-[#c084fc] transition-all duration-200"
            >
              <Download size={16} />
              Fetch from ClickUp
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#86efac] text-[#14532d] rounded-full text-sm font-semibold hover:bg-[#4ade80] transition-all duration-200"
            >
              <Plus size={16} />
              Add Task
            </button>
            <button
              onClick={handleDeleteAllTasks}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#fca5a5] text-[#7f1d1d] rounded-full text-sm font-semibold hover:bg-[#f87171] transition-all duration-200"
            >
              <Trash2 size={16} />
              Delete All
            </button>
            <button
              onClick={handleSaveReport}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Clock}
          label="Total Time"
          value={grandTotalTime}
          unit="hrs"
          bgColor="bg-[#FFFFFF] dark:bg-[#242424]"
          iconColor="text-gray-600 dark:text-gray-300"
          borderColor="border-gray-200 dark:border-[#333333]"
        />
        <StatCard
          icon={FileText}
          label="Tasks"
          value={tasks.filter((t) => t.task).length}
          unit="items"
          bgColor="bg-[#FFFFFF] dark:bg-[#242424]"
          iconColor="text-blue-600 dark:text-blue-400"
          borderColor="border-gray-200 dark:border-[#333333]"
        />
        <StatCard
          icon={MessageSquare}
          label="Discussion"
          value={discussionStats.finalTime}
          unit="hrs"
          bgColor="bg-[#FFFFFF] dark:bg-[#242424]"
          iconColor="text-indigo-600 dark:text-indigo-400"
          borderColor="border-gray-200 dark:border-[#333333]"
        />
        <StatCard
          icon={Bug}
          label="Testing"
          value={testingStats.finalTime}
          unit="hrs"
          bgColor="bg-[#FFFFFF] dark:bg-[#242424]"
          iconColor="text-purple-600 dark:text-purple-400"
          borderColor="border-gray-200 dark:border-[#333333]"
        />
        <StatCard
          icon={CheckCircle}
          label="Valid"
          value={tasksStats.validTime.toFixed(2)}
          unit="hrs"
          bgColor="bg-[#FFFFFF] dark:bg-[#242424]"
          iconColor="text-emerald-600 dark:text-emerald-400"
          borderColor="border-gray-200 dark:border-[#333333]"
        />
        <StatCard
          icon={XCircle}
          label="Invalid"
          value={tasksStats.invalidTime.toFixed(2)}
          unit="hrs"
          bgColor="bg-[#FFFFFF] dark:bg-[#242424]"
          iconColor="text-red-600 dark:text-red-400"
          borderColor="border-gray-200 dark:border-[#333333]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['internal', 'panel', 'nf'].map((cat) => {
          const data = tasksStats.breakdown[cat];
          const titles = { internal: "Internal Tasks", panel: "Panel Bugs", nf: "NF" };
          const colors = {
            internal: "bg-[#FFFFFF] dark:bg-[#242424] border-gray-200 dark:border-[#333333]",
            panel: "bg-[#FFFFFF] dark:bg-[#242424] border-gray-200 dark:border-[#333333]",
            nf: "bg-[#FFFFFF] dark:bg-[#242424] border-gray-200 dark:border-[#333333]"
          };

          return (
            <div key={cat} className={`rounded-xl p-4 border-2 ${colors[cat]} flex flex-col justify-between transition-all duration-200 hover:shadow-md`}>
              <div className="font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase text-sm tracking-wider flex items-center justify-between border-b border-gray-200 dark:border-gray-700/50 pb-2">
                <span>{titles[cat]}</span>
                <span className="bg-[#f3f4f6] dark:bg-[#2A2A2A] px-2.5 py-1 rounded-full text-sm text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-[#333333] shadow-sm">
                  TOTAL: {data.count}
                </span>
              </div>
              <div className="flex justify-between items-center bg-[#FDFDFD] dark:bg-[#2A2A2A] p-3 rounded-lg mb-2 shadow-sm border border-gray-100 dark:border-[#333333]">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">VALID <span className="text-lg text-gray-500 dark:text-gray-400">({data.validCount})</span></span>
                </div>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{data.validTime.toFixed(2)}<span className="text-sm ml-0.5 text-gray-500 dark:text-gray-400">h</span></span>
              </div>
              <div className="flex justify-between items-center bg-[#FDFDFD] dark:bg-[#2A2A2A] p-3 rounded-lg shadow-sm border border-gray-100 dark:border-[#333333]">
                <div className="flex items-center gap-2">
                  <XCircle size={18} className="text-red-500" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">INVALID <span className="text-lg text-gray-500 dark:text-gray-400">({data.invalidCount})</span></span>
                </div>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">{data.invalidTime.toFixed(2)}<span className="text-sm ml-0.5 text-gray-500 dark:text-gray-400">h</span></span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#FFFFFF] dark:bg-[#242424] rounded-xl shadow-sm border border-gray-200 dark:border-[#333333] overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1A5336]">
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[100px]">
                  Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[160px]">
                  CU Link
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] min-w-[300px]">
                  Task / Activity
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[100px]">
                  Hrs
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[100px]">
                  Min
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[80px]">
                  Total Min
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[80px]">
                  Final Time
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[200px]">
                  Type
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[200px]">
                  Status
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[200px]">
                  Bug Type
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[60px]">
                  Valid
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-[#14422b] w-[60px]">
                  Invalid
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-[50px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((entry, index) => (
                <TimeEntryRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onUpdate={onUpdateTask}
                  onDelete={handleDeleteTask}
                  typeOptions={typeOptions}
                  statusOptions={statusOptions}
                  bugTypeOptions={bugTypeOptions}
                  onAddTypeOption={onAddTypeOption}
                  onDeleteTypeOption={onDeleteTypeOption}
                  onAddStatusOption={onAddStatusOption}
                  onDeleteStatusOption={onDeleteStatusOption}
                  onAddBugTypeOption={onAddBugTypeOption}
                  onDeleteBugTypeOption={onDeleteBugTypeOption}
                  cuLink={entry.cuLink}
                />
              ))}

              <tr>
                <td colSpan={13} className="p-0 border-b border-[#333333]">
                  <style>
                    {`
                      .dashboard-collapse .ant-collapse {
                        border: none;
                        background: transparent;
                        border-radius: 0;
                      }
                      .dashboard-collapse .ant-collapse-item {
                        border: none;
                        border-radius: 0 !important;
                      }
                      .dashboard-collapse .ant-collapse-header {
                        background: #2A2A2A;
                        padding: 14px 20px !important;
                        border-radius: 0 !important;
                        transition: all 0.3s ease;
                      }
                      .dashboard-collapse .ant-collapse-header:hover {
                        background: #2e2e2e;
                      }
                      .dashboard-collapse .ant-collapse-content {
                        border: none;
                        border-radius: 0;
                        background: transparent;
                      }
                      .dashboard-collapse .ant-collapse-content-box {
                        padding: 0 !important;
                      }
                      .dashboard-collapse .ant-collapse-expand-icon {
                        padding-inline-end: 12px !important;
                        color: white !important;
                      }
                    `}
                  </style>
                  <div className="dashboard-collapse my-2 mx-4 rounded-xl overflow-hidden border border-gray-200 dark:border-[#333333] bg-white dark:bg-[#242424] shadow-sm">
                    <Collapse
                      activeKey={showDiscussion ? ["discussion"] : []}
                      onChange={() => setShowDiscussion(!showDiscussion)}
                      expandIcon={({ isActive }) => (
                        <div className={`transition-transform duration-300 ease-in-out ${isActive ? "rotate-0" : "-rotate-90"}`}>
                          <ChevronDown size={18} className="text-[#60A5FA]" />
                        </div>
                      )}
                      expandIconPlacement="start"
                      items={[
                        {
                          key: "discussion",
                          label: (
                            <div className="flex items-center gap-3 text-[#60A5FA]">
                              <MessageSquare size={18} />
                              <span className="font-semibold text-sm">Discussion</span>
                              <div className="ml-auto flex items-center gap-3 text-sm">
                                <span className="px-3 py-1 bg-[#60A5FA]/10 text-[#60A5FA] rounded-full backdrop-blur-sm font-semibold">
                                  {discussionStats.finalTime} hrs
                                </span>
                              </div>
                            </div>
                          ),
                          children: (
                            <table className="w-full border-collapse">
                              <tbody>
                                <tr className="bg-[#F8FAFC] dark:bg-[#1A1A1A]">
                                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm border-r border-gray-200 dark:border-[#333333]" style={{ width: "100px", minWidth: "100px" }}>
                                    -
                                  </td>
                                  <td className="px-4 py-3 border-r border-gray-200 dark:border-[#333333]" style={{ width: "460px", minWidth: "460px" }}>
                                    <input
                                      type="text"
                                      value={discussion.note || ""}
                                      onChange={(e) => onUpdateDiscussion("note", e.target.value)}
                                      className="w-full px-3 py-2 text-sm bg-white dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#404040] text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                      placeholder="https://..."
                                    />
                                  </td>
                                  <td className="px-4 py-3 border-r border-gray-200 dark:border-[#333333]" style={{ width: "100px", minWidth: "100px" }}>
                                    <input
                                      min="0"
                                      value={discussion.hrs || 0}
                                      onChange={(e) => onUpdateDiscussion("hrs", Number(e.target.value))}
                                      className="w-full px-2 py-2 text-sm text-center bg-white dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#404040] text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                    />
                                  </td>
                                  <td className="px-4 py-3 border-r border-gray-200 dark:border-[#333333]" style={{ width: "100px", minWidth: "100px" }}>
                                    <input
                                      min="0"
                                      max="59"
                                      value={discussion.min || 0}
                                      onChange={(e) => onUpdateDiscussion("min", Number(e.target.value))}
                                      className="w-full px-2 py-2 text-sm text-center bg-white dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#404040] text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-semibold text-[#60A5FA] border-r border-gray-200 dark:border-[#333333]" style={{ width: "80px", minWidth: "80px" }}>
                                    {discussionStats.totalMin}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-bold text-[#60A5FA] border-r border-gray-200 dark:border-[#333333]" style={{ width: "80px", minWidth: "80px" }}>
                                    {discussionStats.finalTime}
                                  </td>
                                  <td className="bg-[#F8FAFC] dark:bg-[#1A1A1A]"></td>
                                </tr>
                              </tbody>
                            </table>
                          )
                        }
                      ]}
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={13} className="p-0 border-b border-gray-200 dark:border-[#333333]">
                  <div className="dashboard-collapse my-2 mx-4 rounded-xl overflow-hidden border border-gray-200 dark:border-[#333333] bg-white dark:bg-[#242424] shadow-sm">
                    <Collapse
                      activeKey={showMrIssue ? ["mr-issue"] : []}
                      onChange={() => setShowMrIssue(!showMrIssue)}
                      expandIcon={({ isActive }) => (
                        <div className={`transition-transform duration-300 ease-in-out ${isActive ? "rotate-0" : "-rotate-90"}`}>
                          <ChevronDown size={18} className="text-[#60A5FA]" />
                        </div>
                      )}
                      expandIconPlacement="start"
                      items={[
                        {
                          key: "mr-issue",
                          label: (
                            <div className="flex items-center gap-3 text-[#60A5FA]">
                              <MessageSquare size={18} />
                              <span className="font-semibold text-sm">MR Issue</span>
                              <div className="ml-auto flex items-center gap-3 text-sm">
                                <span className="px-3 py-1 bg-[#60A5FA]/10 text-[#60A5FA] rounded-full backdrop-blur-sm font-semibold">
                                  {mrIssueStats.finalTime} hrs
                                </span>
                              </div>
                            </div>
                          ),
                          children: (
                            <table className="w-full border-collapse">
                              <tbody>
                                <tr className="bg-[#F8FAFC] dark:bg-[#1A1A1A]">
                                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm border-r border-gray-200 dark:border-[#333333]" style={{ width: "100px", minWidth: "100px" }}>
                                    -
                                  </td>
                                  <td className="px-4 py-3 border-r border-gray-200 dark:border-[#333333]" style={{ width: "460px", minWidth: "460px" }}>
                                    <input
                                      type="text"
                                      value={mrIssue?.note || ""}
                                      onChange={(e) => onUpdateMrIssue("note", e.target.value)}
                                      className="w-full px-3 py-2 text-sm bg-white dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#404040] text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                      placeholder="MR Issues"
                                    />
                                  </td>
                                  <td className="px-4 py-3 border-r border-gray-200 dark:border-[#333333]" style={{ width: "100px", minWidth: "100px" }}>
                                    <input
                                      min="0"
                                      value={mrIssue?.hrs || 0}
                                      onChange={(e) => onUpdateMrIssue("hrs", Number(e.target.value))}
                                      className="w-full px-2 py-2 text-sm text-center bg-white dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#404040] text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                    />
                                  </td>
                                  <td className="px-4 py-3 border-r border-gray-200 dark:border-[#333333]" style={{ width: "100px", minWidth: "100px" }}>
                                    <input
                                      min="0"
                                      max="59"
                                      value={mrIssue?.min || 0}
                                      onChange={(e) => onUpdateMrIssue("min", Number(e.target.value))}
                                      className="w-full px-2 py-2 text-sm text-center bg-white dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#404040] text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-semibold text-[#60A5FA] border-r border-gray-200 dark:border-[#333333]" style={{ width: "80px", minWidth: "80px" }}>
                                    {mrIssueStats.totalMin}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-bold text-[#60A5FA] border-r border-gray-200 dark:border-[#333333]" style={{ width: "80px", minWidth: "80px" }}>
                                    {mrIssueStats.finalTime}
                                  </td>
                                  <td className="bg-[#F8FAFC] dark:bg-[#1A1A1A]"></td>
                                </tr>
                              </tbody>
                            </table>
                          )
                        }
                      ]}
                    />
                  </div>
                </td>
              </tr>

              <TestingSection
                testing={testing}
                config={config}
                onUpdate={onUpdateTesting}
                onAddBug={onAddBug}
                onUpdateBug={onUpdateBug}
                onDeleteBug={onDeleteBug}
              />

              <tr className="bg-gray-900 dark:bg-[#0F0F0F]">
                <td
                  colSpan={4}
                  className="px-5 py-4 text-right border-r border-gray-700 dark:border-[#333333]"
                >
                  <span className="text-lg font-bold text-white">
                    GRAND TOTAL
                  </span>
                </td>
                <td className="px-4 py-4 text-center border-r border-gray-700 dark:border-[#333333]">
                  <span className="text-lg font-bold text-white">
                    {grandTotalMin}
                  </span>
                </td>
                <td className="px-4 py-4 text-center border-r border-gray-700 dark:border-[#333333]">
                  <span className="text-xl font-bold text-emerald-400">
                    {grandTotalTime}
                  </span>
                </td>
                <td colSpan={3} className="border-r border-gray-700 dark:border-[#333333]"></td>
                <td className="px-4 py-4 text-center border-r border-gray-700 dark:border-[#333333]">
                  <span className="text-lg font-bold text-emerald-400">
                    {tasksStats.validTime.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-4 text-center border-r border-gray-700 dark:border-[#333333]">
                  <span className="text-lg font-bold text-red-400">
                    {tasksStats.invalidTime.toFixed(2)}
                  </span>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <OutputFormat tasks={tasks} testing={testing} discussion={discussion} mrIssue={mrIssue} config={config} onRefresh={onRefresh} />

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onCreateTask}
      />
      
      <ClickupFetchModal
        isOpen={showClickupModal}
        onClose={() => setShowClickupModal(false)}
        existingTasksCount={tasks.filter(t => t.task && t.task.trim() !== "").length}
        onSyncComplete={onRefresh}
        onUpdateDiscussion={onUpdateDiscussion}
        onUpdateMrIssue={onUpdateMrIssue}
        onUpdateTesting={onUpdateTesting}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  bgColor,
  iconColor,
  borderColor,
}) {
  return (
    <div
      className={`${bgColor} rounded-xl p-4 border-2 ${borderColor} transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={iconColor} />
        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{unit}</span>
      </div>
    </div>
  );
}
