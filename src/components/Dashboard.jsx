import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { Modal, message } from "antd";
import TimeEntryRow from "./TimeEntryRow";
import TestingSection from "./TestingSection";
import OutputFormat from "./OutputFormat";
import AddTaskModal from "./AddTaskModal";

export default function Dashboard({
  tasks,
  discussion,
  testing,
  typeOptions,
  statusOptions,
  bugTypeOptions,
  onCreateTask,
  onCreateDefaultTasks,
  onUpdateTask,
  onDeleteTask,
  onUpdateDiscussion,
  onUpdateTesting,
  onAddBug,
  onUpdateBug,
  onDeleteBug,
  onRefresh,
  onSaveSnapshot,
  theme = "emerald",
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && tasks.length === 0) {
      onCreateDefaultTasks(4);
      setInitialized(true);
    } else if (tasks.length > 0) {
      setInitialized(true);
    }
  }, [tasks.length, initialized, onCreateDefaultTasks]);

  const tasksStats = useMemo(() => {
    return tasks.reduce(
      (acc, t) => ({
        totalMin: acc.totalMin + (t.totalMin || 0),
        validTime: acc.validTime + (t.validTime || 0),
        invalidTime: acc.invalidTime + (t.invalidTime || 0),
      }),
      { totalMin: 0, validTime: 0, invalidTime: 0 }
    );
  }, [tasks]);

  const discussionStats = useMemo(() => {
    const totalMin = (discussion.hrs || 0) * 60 + (discussion.min || 0);
    return { totalMin, finalTime: (totalMin / 60).toFixed(2) };
  }, [discussion]);

  const testingStats = useMemo(() => {
    const totalMin =
      (testing.testingTime?.hrs || 0) * 60 + (testing.testingTime?.min || 0);
    return { totalMin, finalTime: (totalMin / 60).toFixed(2) };
  }, [testing]);

  const grandTotalMin =
    tasksStats.totalMin + discussionStats.totalMin + testingStats.totalMin;
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

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      await onSaveSnapshot({
        tasks,
        discussion,
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Daily Time Tracking
            </h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Calendar size={14} />
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus size={16} />
              Add Task
            </button>
            <button
              onClick={handleSaveReport}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          bgColor="bg-gradient-to-br from-gray-50 to-gray-100"
          iconColor="text-gray-600"
          borderColor="border-gray-200"
        />
        <StatCard
          icon={FileText}
          label="Tasks"
          value={tasks.filter((t) => t.task).length}
          unit="items"
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          iconColor="text-blue-600"
          borderColor="border-blue-200"
        />
        <StatCard
          icon={MessageSquare}
          label="Discussion"
          value={discussionStats.finalTime}
          unit="hrs"
          bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
          iconColor="text-indigo-600"
          borderColor="border-indigo-200"
        />
        <StatCard
          icon={Bug}
          label="Testing"
          value={testingStats.finalTime}
          unit="hrs"
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
          iconColor="text-purple-600"
          borderColor="border-purple-200"
        />
        <StatCard
          icon={CheckCircle}
          label="Valid"
          value={tasksStats.validTime.toFixed(2)}
          unit="hrs"
          bgColor="bg-gradient-to-br from-emerald-50 to-emerald-100"
          iconColor="text-emerald-600"
          borderColor="border-emerald-200"
        />
        <StatCard
          icon={XCircle}
          label="Invalid"
          value={tasksStats.invalidTime.toFixed(2)}
          unit="hrs"
          bgColor="bg-gradient-to-br from-red-50 to-red-100"
          iconColor="text-red-600"
          borderColor="border-red-200"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-700 to-emerald-600">
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[100px]">
                  Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[160px]">
                  CU Link
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 min-w-[300px]">
                  Task / Activity
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[100px]">
                  Hrs
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[100px]">
                  Min
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[80px]">
                  Total Min
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[80px]">
                  Final Time
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[200px]">
                  Type
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[200px]">
                  Status
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[200px]">
                  Bug Type
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[60px]">
                  Valid
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-emerald-600 w-[60px]">
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
                  cuLink={entry.cuLink}
                />
              ))}

              <tr
                className="bg-[#145dff82] transition-all duration-200"
                onClick={() => setShowDiscussion(!showDiscussion)}
              >
                <td colSpan={12} className="px-5 py-3.5">
                  <div className="flex items-center gap-3 text-white">
                    <MessageSquare size={18} />
                    <span className="font-semibold text-sm">Discussion</span>
                    <span className="text-blue-200 text-xs transition-transform duration-200">
                      {showDiscussion ? "▼" : "▶"}
                    </span>
                    <span className="ml-auto text-sm font-semibold px-3 py-1 bg-white/20 rounded-full">
                      {discussionStats.finalTime} hrs
                    </span>
                  </div>
                </td>
              </tr>

              {showDiscussion && (
                <tr className="bg-blue-50 animate-slideDown">
                  <td className="px-4 py-3 text-center text-gray-400 text-sm border-r border-gray-200">
                    -
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200">
                    <input
                      type="text"
                      value={discussion.note || ""}
                      onChange={(e) =>
                        onUpdateDiscussion("note", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Discussion notes..."
                    />
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200">
                    <input
                      type="number"
                      min="0"
                      value={discussion.hrs || 0}
                      onChange={(e) =>
                        onUpdateDiscussion("hrs", Number(e.target.value))
                      }
                      className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={discussion.min || 0}
                      onChange={(e) =>
                        onUpdateDiscussion("min", Number(e.target.value))
                      }
                      className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-blue-700 border-r border-gray-200">
                    {discussionStats.totalMin}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-blue-700 border-r border-gray-200">
                    {discussionStats.finalTime}
                  </td>
                  <td colSpan={6} className="bg-gray-50"></td>
                </tr>
              )}

              <TestingSection
                testing={testing}
                onUpdate={onUpdateTesting}
                onAddBug={onAddBug}
                onUpdateBug={onUpdateBug}
                onDeleteBug={onDeleteBug}
              />

              <tr className="bg-gradient-to-r from-gray-900 to-gray-800">
                <td
                  colSpan={4}
                  className="px-5 py-4 text-right border-r border-gray-700"
                >
                  <span className="text-lg font-bold text-white">
                    GRAND TOTAL
                  </span>
                </td>
                <td className="px-4 py-4 text-center border-r border-gray-700">
                  <span className="text-lg font-bold text-white">
                    {grandTotalMin}
                  </span>
                </td>
                <td className="px-4 py-4 text-center border-r border-gray-700">
                  <span className="text-xl font-bold text-emerald-400">
                    {grandTotalTime}
                  </span>
                </td>
                <td colSpan={3} className="border-r border-gray-700"></td>
                <td className="px-4 py-4 text-center border-r border-gray-700">
                  <span className="text-lg font-bold text-emerald-400">
                    {tasksStats.validTime.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-4 text-center border-r border-gray-700">
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

      <OutputFormat tasks={tasks} testing={testing} discussion={discussion} />

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onCreateTask}
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
      className={`${bgColor} rounded-xl p-4 border-2 ${borderColor} transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={iconColor} />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        <span className="text-xs text-gray-500 font-semibold">{unit}</span>
      </div>
    </div>
  );
}
