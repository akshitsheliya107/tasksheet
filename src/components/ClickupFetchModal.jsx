import { useState } from "react";
import { Modal, DatePicker, Radio, Button, Alert } from "antd";
import { Download, Calendar, AlertCircle, CheckCircle, XCircle, Loader } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { clickupSyncAPI, tasksAPI, discussionAPI, mrIssueAPI, testingAPI } from "../services/api";
import ConflictResolutionModal from "./ConflictResolutionModal";

const fetchModalStyles = `
  .dark .ant-modal-content {
    background-color: #0a0a0a !important;
    border: 1px solid #262626;
  }
  .dark .ant-modal-header {
    background-color: #0a0a0a !important;
    border-bottom: 1px solid #262626 !important;
  }
  .dark .ant-modal-title {
    color: white !important;
  }
  .dark .ant-modal-close {
    color: #737373 !important;
  }
  .dark .ant-picker {
    background-color: #000000 !important;
    border-color: #404040 !important;
  }
  .dark .ant-picker-input > input {
    color: white !important;
  }
  .dark .ant-radio-wrapper {
    color: #e5e5e5 !important;
  }
`;

export default function ClickupFetchModal({ 
  isOpen, 
  onClose, 
  existingTasksCount, 
  onSyncComplete,
  onUpdateDiscussion,
  onUpdateMrIssue,
  onUpdateTesting
}) {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [conflictMode, setConflictMode] = useState("merge");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("config"); // "config" | "fetching" | "preview" | "applying"
  const [fetchResult, setFetchResult] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    setStep("fetching");
    setFetchResult(null);

    try {
      const dateStr = selectedDate.format("YYYY-MM-DD");
      const result = await clickupSyncAPI.syncFromClickup(dateStr);

      if (!result.success) {
        toast.error(result.error || "Failed to fetch from ClickUp");
        setStep("config");
        setLoading(false);
        return;
      }

      if (!result.tasks || result.tasks.length === 0) {
        toast(`No time entries found for ${dateStr}`, { icon: "ℹ️" });
        setStep("config");
        setLoading(false);
        return;
      }

      setFetchResult(result);
      setStep("preview");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while fetching");
      setStep("config");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    setStep("applying");

    try {
      const syncResult = await tasksAPI.syncFromClickup(
        fetchResult.tasks,
        conflictMode
      );

      // Check for conflicts (only in merge mode)
      if (conflictMode === "merge" && syncResult.conflicts && syncResult.conflicts.length > 0) {
        // Show conflict resolution dialog
        setConflicts(syncResult.conflicts);
        setShowConflictModal(true);
        setLoading(false);
        // Don't close fetch modal yet - wait for conflicts to be resolved
        return;
      }

      await applySpecialSections(fetchResult.specialSections);
      showSuccessAndClose(syncResult);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply changes");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  const handleConflictsResolved = async (resolutions) => {
    setShowConflictModal(false);
    setLoading(true);
    
    try {
      // Re-sync with resolutions
      const syncResult = await tasksAPI.syncFromClickup(
        fetchResult.tasks,
        conflictMode,
        resolutions
      );
      
      await applySpecialSections(fetchResult.specialSections);
      showSuccessAndClose(syncResult);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply changes");
    } finally {
      setLoading(false);
    }
  };

  const applySpecialSections = async (specialSections) => {
    if (!specialSections) return;
    
    const { discussion, mrIssue, testing } = specialSections;
    
    if (discussion && (discussion.timeMs > 0 || discussion.link)) {
      const totalMin = Math.round(discussion.timeMs / 1000 / 60);
      const hrs = Math.floor(totalMin / 60);
      const min = totalMin % 60;
      if (onUpdateDiscussion) onUpdateDiscussion({ hrs, min });
    }
    
    if (mrIssue && (mrIssue.timeMs > 0 || mrIssue.link)) {
      const totalMin = Math.round(mrIssue.timeMs / 1000 / 60);
      const hrs = Math.floor(totalMin / 60);
      const min = totalMin % 60;
      if (onUpdateMrIssue) onUpdateMrIssue({ hrs, min });
    }
    
    if (testing && (testing.timeMs > 0 || testing.link)) {
      const totalMin = Math.round(testing.timeMs / 1000 / 60);
      const hrs = Math.floor(totalMin / 60);
      const min = totalMin % 60;
      if (onUpdateTesting) onUpdateTesting({ testingTime: { hrs, min } });
    }
  };

  const showSuccessAndClose = async (syncResult) => {
    const messages = [];
    if (syncResult.added > 0) messages.push(`${syncResult.added} added`);
    if (syncResult.updated > 0) messages.push(`${syncResult.updated} updated`);
    if (syncResult.skipped > 0) messages.push(`${syncResult.skipped} kept manual`);
    
    toast.success(`✅ Sync complete: ${messages.join(", ")}`, { duration: 4000 });
    
    if (onSyncComplete) {
      await onSyncComplete();
    }
    
    handleClose();
  };

  const handleClose = () => {
    setStep("config");
    setFetchResult(null);
    setConflictMode("merge");
    setSelectedDate(dayjs());
    onClose();
  };

  return (
    <>
      <style>{fetchModalStyles}</style>
      <Modal
        title={
          <div className="flex items-center gap-2 text-gray-800 dark:text-white">
            <Download size={20} className="text-emerald-600" />
            Fetch from ClickUp
          </div>
        }
        open={isOpen}
        onCancel={handleClose}
        footer={null}
        width={600}
        centered
        destroyOnHidden
      >
        {/* STEP 1: CONFIG */}
        {step === "config" && (
          <div className="space-y-5 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar size={14} />
                Select Date
              </label>
              <DatePicker
                value={selectedDate}
                onChange={(d) => setSelectedDate(d || dayjs())}
                className="w-full"
                format="DD/MM/YYYY"
                allowClear={false}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Time entries from this date will be fetched
              </p>
            </div>

            {existingTasksCount > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Existing Tasks ({existingTasksCount})
                </label>
                <Radio.Group 
                  value={conflictMode} 
                  onChange={(e) => setConflictMode(e.target.value)}
                  className="w-full"
                >
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      conflictMode === "merge" 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                        : "border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600"
                    }`}
                      onClick={() => setConflictMode("merge")}
                    >
                      <Radio value="merge">
                        <div className="ml-1">
                          <p className="font-semibold text-gray-800 dark:text-white">Smart Merge (Recommended)</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Update existing tasks, add new ones, preserve manual edits
                          </p>
                        </div>
                      </Radio>
                    </div>
                    
                    <div className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      conflictMode === "replace" 
                        ? "border-red-500 bg-red-50 dark:bg-red-950/30" 
                        : "border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600"
                    }`}
                      onClick={() => setConflictMode("replace")}
                    >
                      <Radio value="replace">
                        <div className="ml-1">
                          <p className="font-semibold text-gray-800 dark:text-white">Replace All ClickUp Tasks</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Remove all ClickUp-synced tasks, fetch fresh. Manual entries are kept.
                          </p>
                        </div>
                      </Radio>
                    </div>
                  </div>
                </Radio.Group>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-neutral-800">
              <Button onClick={handleClose}>Cancel</Button>
              <Button 
                type="primary" 
                onClick={handleFetch}
                loading={loading}
                icon={<Download size={14} />}
                className="bg-emerald-600"
              >
                Fetch Tasks
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: FETCHING */}
        {step === "fetching" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader size={40} className="text-emerald-600 animate-spin" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Fetching from ClickUp...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This may take a few seconds
            </p>
          </div>
        )}

        {/* STEP 3: PREVIEW */}
        {/* {step === "preview" && fetchResult && (
          <div className="space-y-4 py-2">
            <Alert
              type="success"
              showIcon
              message={`Found ${fetchResult.tasks.length} task${fetchResult.tasks.length !== 1 ? 's' : ''}`}
              description={`From ${fetchResult.rawTimeEntries} time entries on ${selectedDate.format("DD MMM YYYY")}`}
            />

            <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-neutral-800 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-900 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Task</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 w-24">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 w-24">Status</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 w-16">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                  {fetchResult.tasks.map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-900">
                      <td className="px-3 py-2">
                        <p className="text-gray-800 dark:text-gray-200 line-clamp-2 max-w-xs" title={t.task}>
                          {t.task}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded">
                          {t.type || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                        {t.status || "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-mono text-gray-700 dark:text-gray-200">
                        {t.hrs}h {t.min}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-neutral-800">
              <Button onClick={() => setStep("config")}>Back</Button>
              <Button 
                type="primary" 
                onClick={handleApply}
                loading={loading}
                icon={<CheckCircle size={14} />}
                className="bg-emerald-600"
              >
                Apply {conflictMode === "replace" ? "(Replace)" : "(Merge)"}
              </Button>
            </div>
          </div>
        )} */}

{/* STEP 3: PREVIEW */}
{step === "preview" && fetchResult && (
  <div className="space-y-4 py-2">
    <Alert
      type="success"
      showIcon
      message={`Found ${fetchResult.tasks.length} task${fetchResult.tasks.length !== 1 ? 's' : ''}`}
      description={`From ${fetchResult.rawTimeEntries} time entries on ${selectedDate.format("DD MMM YYYY")}`}
    />

    <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-neutral-800 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-neutral-900 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Task</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 w-24">Type</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 w-24">Status</th>
            {/* ✅ NEW: Bug Type column */}
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 w-28">Bug Type</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 w-16">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
          {fetchResult.tasks.map((t, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-900">
              <td className="px-3 py-2">
                <p className="text-gray-800 dark:text-gray-200 line-clamp-2 max-w-xs" title={t.task}>
                  {t.task}
                </p>
              </td>
              <td className="px-3 py-2 text-xs">
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded">
                  {t.type || "—"}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                {t.status || "—"}
              </td>
              {/* ✅ NEW: Bug Type cell */}
              <td className="px-3 py-2 text-xs">
                {t.bug_type ? (
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded">
                    {t.bug_type}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-right text-xs font-mono text-gray-700 dark:text-gray-200">
                {t.hrs}h {t.min}m
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-neutral-800">
      <Button onClick={() => setStep("config")}>Back</Button>
      <Button 
        type="primary" 
        onClick={handleApply}
        loading={loading}
        icon={<CheckCircle size={14} />}
        className="bg-emerald-600"
      >
        Apply {conflictMode === "replace" ? "(Replace)" : "(Merge)"}
      </Button>
    </div>
  </div>
)}
        {/* STEP 4: APPLYING */}
        {step === "applying" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader size={40} className="text-emerald-600 animate-spin" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Applying changes...
            </p>
          </div>
        )}
      </Modal>

      <ConflictResolutionModal
        isOpen={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          handleClose();
        }}
        conflicts={conflicts}
        onResolve={handleConflictsResolved}
      />
    </>
  );
}
