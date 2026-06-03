import { useState } from "react";

import {
  Calendar,
  Clock,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  History as HistoryIcon,
  Eye,
} from "lucide-react";
import { Modal, message, Input, DatePicker } from "antd";
import ReportDetailsModal from "./ReportDetailsModal";

export default function History({ snapshots, onDeleteSnapshot, onSaveSnapshot }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [targetDate, setTargetDate] = useState(null);
  const [isCopying, setIsCopying] = useState(false);
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewedSnapshot, setViewedSnapshot] = useState(null);

  const filteredSnapshots = snapshots
    .filter((s) => s.snapshot_date.includes(searchTerm))
    .sort((a, b) => new Date(b.snapshot_date) - new Date(a.snapshot_date));

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Report",
      content: "Are you sure you want to delete this saved report?",
      okText: "Yes, Delete",
      cancelText: "Cancel",
      okType: "danger",
      onOk: async () => {
        try {
          await onDeleteSnapshot(id);
          message.success("Report deleted successfully");
        } catch (error) {
          message.error("Failed to delete report");
        }
      },
    });
  };

  const openCopyModal = (snapshot) => {
    setSelectedSnapshot(snapshot);
    setTargetDate(null);
    setCopyModalOpen(true);
  };

  const openViewModal = (snapshot) => {
    setViewedSnapshot(snapshot);
    setViewModalOpen(true);
  };

  const handleCopy = async () => {
    if (!targetDate) {
      message.warning("Please select a target date");
      return;
    }
    const customDateStr = targetDate.format("YYYY-MM-DD");
    
    setIsCopying(true);
    try {
      await onSaveSnapshot(
        {
          tasks: selectedSnapshot.tasks_data,
          discussion: selectedSnapshot.discussion_data,
          testing: selectedSnapshot.testing_data,
          stats: selectedSnapshot.total_stats,
        },
        customDateStr
      );
      message.success(`Report copied to ${customDateStr}`);
      setCopyModalOpen(false);
    } catch (error) {
      message.error("Failed to copy report");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              Saved Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              View and manage your daily tracking history
            </p>
          </div>
          <div className="w-full md:w-64">
            <Input
              prefix={<Search size={16} className="text-gray-400 dark:text-gray-500" />}
              placeholder="Search by date (YYYY-MM-DD)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              size="large"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSnapshots.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <HistoryIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
              No saved reports found
            </h3>
            <p className="text-gray-400 dark:text-gray-500">Save a daily report to see it here.</p>
          </div>
        ) : (
          filteredSnapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 dark:hover:border-gray-600 transition-all duration-300 relative group"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openViewModal(snapshot)}
                  className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors"
                  title="View full report"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => openCopyModal(snapshot)}
                  className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                  title="Copy to another date"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleDelete(snapshot.id)}
                  className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                  title="Delete report"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                    {snapshot.snapshot_date}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(snapshot.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700/50">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-gray-400 dark:text-gray-500" /> Total Time
                  </span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {snapshot.total_stats?.grandTotalTime || "0.00"} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700/50">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-gray-400 dark:text-gray-500" /> Tasks
                  </span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {snapshot.tasks_data?.length || 0}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">
                        Valid
                      </p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {snapshot.total_stats?.validTime?.toFixed(2) || "0.00"}h
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-red-500" />
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">
                        Invalid
                      </p>
                      <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                        {snapshot.total_stats?.invalidTime?.toFixed(2) || "0.00"}h
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Copy size={20} className="text-blue-600" />
            <span>Copy Report to Another Date</span>
          </div>
        }
        open={copyModalOpen}
        onCancel={() => setCopyModalOpen(false)}
        onOk={handleCopy}
        okText="Copy Report"
        okButtonProps={{ loading: isCopying, className: "bg-blue-600 hover:bg-blue-700" }}
        centered
        destroyOnHidden
      >
        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-600">
            You are copying the report from{" "}
            <strong>{selectedSnapshot?.snapshot_date}</strong>. Select the new
            target date:
          </p>
          <div>
            <DatePicker
              className="w-full"
              size="large"
              onChange={(date) => setTargetDate(date)}
            />
          </div>
        </div>
      </Modal>

      <ReportDetailsModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        snapshot={viewedSnapshot}
      />
    </div>
  );
}
