import { useState } from "react";
import { Modal, Button, Alert } from "antd";
import { AlertTriangle, ArrowRight, User, Download, Check, X } from "lucide-react";

const conflictStyles = `
  .dark .ant-modal-content {
    background-color: #0a0a0a !important;
    border: 1px solid #262626;
  }
  .dark .ant-modal-header {
    background-color: #0a0a0a !important;
    border-bottom: 1px solid #262626 !important;
  }
  .dark .ant-modal-title { color: white !important; }
  .dark .ant-modal-close { color: #737373 !important; }
`;

export default function ConflictResolutionModal({ 
  isOpen, 
  onClose, 
  conflicts = [], 
  onResolve 
}) {
  const [resolutions, setResolutions] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || conflicts.length === 0) return null;

  const currentConflict = conflicts[currentIndex];
  const totalConflicts = conflicts.length;

  const handleResolve = (choice) => {
    const newResolutions = {
      ...resolutions,
      [currentConflict.existing.clickup_task_id]: choice,
    };
    setResolutions(newResolutions);

    if (currentIndex < totalConflicts - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last conflict resolved
      onResolve(newResolutions);
      handleClose();
    }
  };

  const handleResolveAll = (choice) => {
    const allResolutions = {};
    conflicts.forEach(c => {
      allResolutions[c.existing.clickup_task_id] = choice;
    });
    onResolve({ ...resolutions, ...allResolutions });
    handleClose();
  };

  const handleClose = () => {
    setResolutions({});
    setCurrentIndex(0);
    onClose();
  };

  const fieldChanges = getFieldChanges(currentConflict);

  return (
    <>
      <style>{conflictStyles}</style>
      <Modal
        title={
          <div className="flex items-center gap-2 text-gray-800 dark:text-white">
            <AlertTriangle size={20} className="text-amber-500" />
            Conflict Detected ({currentIndex + 1} of {totalConflicts})
          </div>
        }
        open={isOpen}
        onCancel={handleClose}
        footer={null}
        width={800}
        centered
        destroyOnHidden
      >
        <div className="py-2 space-y-4">
          <Alert
            type="warning"
            showIcon
            message="This task was manually edited"
            description="ClickUp has new data for this task. What would you like to do?"
          />

          {/* Task Name */}
          <div className="bg-gray-50 dark:bg-neutral-900 p-3 rounded-lg border border-gray-200 dark:border-neutral-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Task</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
              {currentConflict.existing.task}
            </p>
            {currentConflict.existing.cu_link && (
              <a 
                href={currentConflict.existing.cu_link}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1 inline-block"
              >
                Open in ClickUp ↗
              </a>
            )}
          </div>

          {/* Comparison Table */}
          {fieldChanges.length > 0 ? (
            <div className="border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-100 dark:bg-neutral-900 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                <div className="p-3">Field</div>
                <div className="p-3 border-l border-gray-200 dark:border-neutral-800 flex items-center gap-1.5">
                  <User size={12} className="text-blue-500" />
                  Your Value
                </div>
                <div className="p-3 border-l border-gray-200 dark:border-neutral-800 flex items-center gap-1.5">
                  <Download size={12} className="text-emerald-500" />
                  ClickUp Value
                </div>
              </div>
              {fieldChanges.map((change, i) => (
                <div 
                  key={i}
                  className="grid grid-cols-3 text-sm border-t border-gray-200 dark:border-neutral-800"
                >
                  <div className="p-3 font-medium text-gray-700 dark:text-gray-300">
                    {change.label}
                  </div>
                  <div className="p-3 border-l border-gray-200 dark:border-neutral-800 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20">
                    {change.existing || <span className="text-gray-400 italic">empty</span>}
                  </div>
                  <div className="p-3 border-l border-gray-200 dark:border-neutral-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                    {change.incoming || <span className="text-gray-400 italic">empty</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert
              type="info"
              message="No differences detected"
              description="The data is the same. You can safely use either version."
            />
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="large"
                onClick={() => handleResolve("keep_manual")}
                icon={<User size={16} />}
                className="!h-auto !py-3 !border-blue-300 !text-blue-700 hover:!border-blue-500 dark:!border-blue-900 dark:!text-blue-400 dark:hover:!border-blue-700"
              >
                Keep Manual
              </Button>
              <Button
                size="large"
                onClick={() => handleResolve("use_clickup")}
                icon={<Download size={16} />}
                className="!h-auto !py-3 !bg-emerald-600 !border-emerald-600 !text-white hover:!bg-emerald-700"
              >
                Use ClickUp
              </Button>
            </div>

            {totalConflicts > 1 && (
              <>
                <div className="text-xs text-center text-gray-500 dark:text-gray-400 uppercase tracking-wider py-1">
                  — OR —
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="small"
                    onClick={() => handleResolveAll("keep_manual")}
                    type="text"
                    className="!text-blue-600 dark:!text-blue-400"
                  >
                    Keep Manual for All ({totalConflicts})
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleResolveAll("use_clickup")}
                    type="text"
                    className="!text-emerald-600 dark:!text-emerald-400"
                  >
                    Use ClickUp for All ({totalConflicts})
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

function getFieldChanges(conflict) {
  const { existing, incoming } = conflict;
  const fields = [
    { key: 'task', label: 'Task Description' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'bug_type', label: 'Bug Type' },
    { key: 'hrs', label: 'Hours' },
    { key: 'min', label: 'Minutes' },
  ];

  return fields
    .map(f => ({
      ...f,
      existing: String(existing[f.key] ?? ""),
      incoming: String(incoming[f.key] ?? ""),
    }))
    .filter(f => f.existing !== f.incoming);
}
