import { useState } from "react";
import {
  Calendar,
  Clock,
  Eye,
  Trash2,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Modal, message } from "antd";
import { useSnapshots } from "../hooks/useSupabase";

export default function HistoryView({ theme }) {
  const { snapshots, loading, getSnapshot, deleteSnapshot } = useSnapshots();
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [viewingData, setViewingData] = useState(null);

  const handleViewSnapshot = async (snapshot) => {
    const data = await getSnapshot(snapshot.snapshot_date);
    if (data) {
      setSelectedSnapshot(snapshot);
      setViewingData(data);
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    Modal.confirm({
      title: "Delete History Entry",
      content:
        "Are you sure you want to delete this history entry? This action cannot be undone.",
      okText: "Delete",
      cancelText: "Cancel",
      okType: "danger",
      centered: true,
      onOk: async () => {
        await deleteSnapshot(id);
        if (selectedSnapshot?.id === id) {
          setSelectedSnapshot(null);
          setViewingData(null);
        }
        message.success("History entry deleted");
      },
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  if (viewingData) {
    return (
      <HistoryDetail
        snapshot={selectedSnapshot}
        data={viewingData}
        onBack={() => {
          setSelectedSnapshot(null);
          setViewingData(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 className="text-2xl font-bold text-gray-800">History</h2>
        <p className="text-gray-500 text-sm mt-1">
          View your past daily reports (Read-only)
        </p>
      </div>

      {/* History List */}
      {snapshots.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600">No history yet</h3>
          <p className="text-gray-400 text-sm mt-1">
            Save your daily reports to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              onClick={() => handleViewSnapshot(snapshot)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-100">
                    <Calendar size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {formatDate(snapshot.snapshot_date)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Saved on {new Date(snapshot.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(snapshot.id, e)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryDetail({ snapshot, data, onBack }) {
  const tasks = data.tasks_data || [];
  const discussion = data.discussion_data || {};
  const testing = data.testing_data || {};
  const stats = data.total_stats || {};

  const discussionTime =
    ((discussion.hrs || 0) * 60 + (discussion.min || 0)) / 60;
  const testingTime =
    ((testing.testingTime?.hrs || 0) * 60 + (testing.testingTime?.min || 0)) /
    60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">
              {new Date(snapshot.snapshot_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <p className="text-gray-500 text-sm">
              Read-only view of saved report
            </p>
          </div>
          <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded text-sm font-medium">
            📋 Read Only
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          title="Total Time"
          value={`${stats.grandTotalTime || 0} hrs`}
          icon={Clock}
          bgColor="bg-gray-50"
        />
        <StatCard
          title="Tasks"
          value={tasks.length}
          icon={FileText}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Valid Time"
          value={`${stats.validTime?.toFixed(2) || 0} hrs`}
          icon={CheckCircle}
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Invalid Time"
          value={`${stats.invalidTime?.toFixed(2) || 0} hrs`}
          icon={XCircle}
          bgColor="bg-red-50"
        />
        <StatCard
          title="Bugs Found"
          value={testing.bugs?.length || 0}
          icon={FileText}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Tasks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-xs uppercase">
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Task</th>
                <th className="px-4 py-3 text-center font-semibold">Hours</th>
                <th className="px-4 py-3 text-center font-semibold">Type</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Valid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {task.date || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-md">
                    <div className="truncate">{task.task || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    {task.finalTime || 0}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {task.type || "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {task.status || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {task.isValid === true && (
                      <CheckCircle
                        size={16}
                        className="text-emerald-500 mx-auto"
                      />
                    )}
                    {task.isValid === false && (
                      <XCircle size={16} className="text-red-500 mx-auto" />
                    )}
                    {task.isValid === null && (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discussion & Testing Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">💬 Discussion</h3>
          <p className="text-gray-600 text-sm mb-4">
            {discussion.note || "No notes"}
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {discussionTime.toFixed(2)} hrs
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">🧪 Testing</h3>
          <p className="text-gray-600 text-sm">
            Module: {testing.testingModule || "N/A"}
          </p>
          <p className="text-gray-600 text-sm mb-4">
            Bugs: {testing.bugs?.length || 0}
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {testingTime.toFixed(2)} hrs
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, bgColor }) {
  return (
    <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-gray-600" />
        <span className="text-xs font-medium text-gray-600">{title}</span>
      </div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
