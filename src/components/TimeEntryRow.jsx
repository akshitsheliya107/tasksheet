import { useState, useEffect, useCallback, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import { Select, Divider, Input, Button, Space, Modal } from "antd";
import debounce from "lodash.debounce";

export default function TimeEntryRow({
  entry,
  index,
  onUpdate,
  onDelete,
  readOnly = false,
  typeOptions = [],
  statusOptions = [],
  bugTypeOptions = [],
  onAddTypeOption,
  onDeleteTypeOption,
  onAddStatusOption,
  onDeleteStatusOption,
  onAddBugTypeOption,
  onDeleteBugTypeOption,
}) {
  const [localHrs, setLocalHrs] = useState(String(entry.hrs || 0));
  const [localMin, setLocalMin] = useState(String(entry.min || 0));
  const [localEntry, setLocalEntry] = useState(entry);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100); // small delay to wait for modal animation
    }
  }, [isModalOpen]);

  const handleAddOption = async () => {
    const trimmedVal = newOptionValue.trim();
    if (!trimmedVal) return;
    
    if (modalType === "type") {
      await onAddTypeOption(trimmedVal);
      setLocalEntry(prev => ({ ...prev, type: trimmedVal }));
      triggerUpdate("type", trimmedVal);
    } else if (modalType === "status") {
      await onAddStatusOption(trimmedVal);
      setLocalEntry(prev => ({ ...prev, status: trimmedVal }));
      triggerUpdate("status", trimmedVal);
    } else if (modalType === "bugType") {
      await onAddBugTypeOption(trimmedVal);
      setLocalEntry(prev => ({ ...prev, bugType: trimmedVal }));
      triggerUpdate("bugType", trimmedVal);
    }
    
    setNewOptionValue("");
    setIsModalOpen(false);
  };

  useEffect(() => {
    setLocalEntry({
      ...entry,
      type: typeof entry.type === 'object' ? entry.type?.name : entry.type,
      status: typeof entry.status === 'object' ? entry.status?.name : entry.status,
      bugType: typeof entry.bugType === 'object' ? entry.bugType?.name : entry.bugType,
    });
    setLocalHrs(String(entry.hrs || 0));
    setLocalMin(String(entry.min || 0));
  }, [entry]);

  const safeType = typeof localEntry.type === 'object' ? localEntry.type?.name : localEntry.type;
  const safeStatus = typeof localEntry.status === 'object' ? localEntry.status?.name : localEntry.status;
  const safeBugType = typeof localEntry.bugType === 'object' ? localEntry.bugType?.name : localEntry.bugType;

  const calculateTotals = (hrs, min) => {
    const h = Number(hrs) || 0;
    const m = Number(min) || 0;
    const totalMinutes = h * 60 + m;
    const finalTime = Number((totalMinutes / 60).toFixed(2));
    return { totalMinutes, finalTime };
  };

  const debouncedUpdate = useCallback(
    debounce((updatedEntry) => {
      if (!readOnly && onUpdate) {
        onUpdate(updatedEntry.id, updatedEntry);
      }
    }, 600),
    [onUpdate, readOnly]
  );

  const triggerUpdate = (field, value) => {
    if (readOnly) return;

    let updated = { ...localEntry, [field]: value };

    if (field === "hrs" || field === "min") {
      const hrsVal = field === "hrs" ? value : localHrs;
      const minVal = field === "min" ? value : localMin;
      const { totalMinutes, finalTime } = calculateTotals(hrsVal, minVal);

      updated.hrs = Number(hrsVal) || 0;
      updated.min = Number(minVal) || 0;
      updated.totalMin = totalMinutes;
      updated.finalTime = finalTime;
      updated.validTime = updated.isValid === true ? finalTime : 0;
      updated.invalidTime = updated.isValid === false ? finalTime : 0;
    }

    setLocalEntry(updated);
    debouncedUpdate(updated);
  };

  const handleNumericChange = (field, val) => {
    if (!/^\d*$/.test(val)) return;

    if (field === "hrs") {
      setLocalHrs(val);
      triggerUpdate("hrs", val);
    } else {
      const numVal = parseInt(val, 10);
      if (val !== "" && numVal > 59) return;
      setLocalMin(val);
      triggerUpdate("min", val);
    }
  };

  const handleBlur = (field) => {
    if (field === "hrs" && localHrs === "") {
      setLocalHrs("0");
      triggerUpdate("hrs", "0");
    }
    if (field === "min" && localMin === "") {
      setLocalMin("0");
      triggerUpdate("min", "0");
    }
  };

  const handleKeyDown = (field, e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseInt(field === "hrs" ? localHrs : localMin, 10) || 0;
      const delta = e.key === "ArrowUp" ? 1 : -1;
      let next = current + delta;

      if (field === "min") {
        if (next < 0) next = 59;
        if (next > 59) next = 0;
      } else {
        if (next < 0) next = 0;
      }

      const strVal = String(next);
      if (field === "hrs") setLocalHrs(strVal);
      else setLocalMin(strVal);
      triggerUpdate(field, strVal);
    }
  };

  const handleValidCheck = (checked) => {
    const updated = { ...localEntry, isValid: checked ? true : null };
    const { finalTime } = calculateTotals(localHrs, localMin);
    updated.validTime = checked ? finalTime : 0;
    updated.invalidTime = 0;
    setLocalEntry(updated);
    debouncedUpdate(updated);
  };

  const handleInvalidCheck = (checked) => {
    const updated = { ...localEntry, isValid: checked ? false : null };
    const { finalTime } = calculateTotals(localHrs, localMin);
    updated.invalidTime = checked ? finalTime : 0;
    updated.validTime = 0;
    setLocalEntry(updated);
    debouncedUpdate(updated);
  };

  const rowBg = index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900/50";
  const { totalMinutes, finalTime } = calculateTotals(localHrs, localMin);

  return (
    <tr className={`${rowBg} hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all duration-200 animate-fadeIn`}>
      <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={localEntry.date || ""}
            onChange={(e) => {
              setLocalEntry({ ...localEntry, date: e.target.value });
              triggerUpdate("date", e.target.value);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200"
            placeholder="DD/MM/YYYY"
            disabled={readOnly}
          />
          <div className="flex justify-start">
            {entry.clickup_task_id ? (
              <span 
                title={`Synced from ClickUp${entry.manually_edited ? ' • Manually edited' : ''}`}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  entry.manually_edited
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                }`}
              >
                {entry.manually_edited ? "CU✎" : "CU"}
              </span>
            ) : entry.task && entry.task.trim() !== "" ? (
              <span 
                title="Manually added"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
              >
                M
              </span>
            ) : null}
          </div>
        </div>
      </td>

      <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700">
        {readOnly ? (
          localEntry.cuLink ? (
            <a href={localEntry.cuLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline text-xs break-all">
              {localEntry.cuLink}
            </a>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
          )
        ) : (
          <input
            type="text"
            value={localEntry.cuLink || ""}
            onChange={(e) => {
              setLocalEntry({ ...localEntry, cuLink: e.target.value });
              triggerUpdate("cuLink", e.target.value);
            }}
            className="w-full px-2 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200"
            placeholder="Paste CU Link..."
            disabled={readOnly}
          />
        )}
      </td>

      <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700">
        <textarea
          value={localEntry.task || ""}
          onChange={(e) => {
            setLocalEntry({ ...localEntry, task: e.target.value });
            triggerUpdate("task", e.target.value);
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none transition-all duration-200"
          placeholder="Enter task description..."
          rows={2}
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700">
        <input
          type="text"
          inputMode="numeric"
          value={localHrs}
          onChange={(e) => handleNumericChange("hrs", e.target.value)}
          onBlur={() => handleBlur("hrs")}
          onKeyDown={(e) => handleKeyDown("hrs", e)}
          className="w-full px-2 py-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200"
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700">
        <input
          type="text"
          inputMode="numeric"
          value={localMin}
          onChange={(e) => handleNumericChange("min", e.target.value)}
          onBlur={() => handleBlur("min")}
          onKeyDown={(e) => handleKeyDown("min", e)}
          className="w-full px-2 py-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200"
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{totalMinutes}</span>
      </td>

      <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-700">
        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{finalTime}</span>
      </td>

      <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700">
        {readOnly ? (
          <span className="text-sm text-gray-600 dark:text-gray-400">{safeType || "-"}</span>
        ) : (
          <Select
            value={safeType || undefined}
            onChange={(val) => {
              setLocalEntry({ ...localEntry, type: val });
              triggerUpdate("type", val);
            }}
            placeholder="Select Type"
            className="w-full"
            size="middle"
            allowClear
            showSearch
            optionLabelProp="value"
            optionFilterProp="label"
            options={(typeOptions || []).map((opt) => ({
              label: (
                <div className="flex justify-between items-center group">
                  <span>{opt.name || opt}</span>
                  {opt.id && (
                    <Trash2 
                      size={14} 
                      className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity" 
                      onClick={(e) => {
                        e.stopPropagation();
                        Modal.confirm({
                          title: 'Delete Option',
                          content: `Are you sure you want to delete "${opt.name || opt}"?`,
                          okText: 'Delete',
                          cancelText: 'Cancel',
                          okType: 'danger',
                          centered: true,
                          onOk: () => onDeleteTypeOption(opt.id)
                        });
                      }}
                    />
                  )}
                </div>
              ),
              value: opt.name || opt,
              searchLabel: opt.name || opt
            }))}
            filterOption={(input, option) =>
              (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
            }
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                <Button 
                  type="text" 
                  icon={<Plus size={14}/>} 
                  className="w-full text-left flex items-center gap-2 justify-start px-3 py-1.5 hover:text-emerald-600 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalType("type");
                    setNewOptionValue("");
                    setIsModalOpen(true);
                  }}
                >
                  Add new type option
                </Button>
              </>
            )}
          />
        )}
      </td>

      <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700">
        {readOnly ? (
          <span className="text-sm text-gray-600 dark:text-gray-400">{safeStatus || "-"}</span>
        ) : (
          <Select
            value={safeStatus || undefined}
            onChange={(val) => {
              setLocalEntry({ ...localEntry, status: val });
              triggerUpdate("status", val);
            }}
            placeholder="Select Status"
            className="w-full"
            size="middle"
            allowClear
            showSearch
            optionLabelProp="value"
            optionFilterProp="label"
            options={(statusOptions || []).map((opt) => ({
              label: (
                <div className="flex justify-between items-center group">
                  <span>{opt.name || opt}</span>
                  {opt.id && (
                    <Trash2 
                      size={14} 
                      className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity" 
                      onClick={(e) => {
                        e.stopPropagation();
                        Modal.confirm({
                          title: 'Delete Option',
                          content: `Are you sure you want to delete "${opt.name || opt}"?`,
                          okText: 'Delete',
                          cancelText: 'Cancel',
                          okType: 'danger',
                          centered: true,
                          onOk: () => onDeleteStatusOption(opt.id)
                        });
                      }}
                    />
                  )}
                </div>
              ),
              value: opt.name || opt,
              searchLabel: opt.name || opt
            }))}
            filterOption={(input, option) =>
              (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
            }
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                <Button 
                  type="text" 
                  icon={<Plus size={14}/>} 
                  className="w-full text-left flex items-center gap-2 justify-start px-3 py-1.5 hover:text-emerald-600 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalType("status");
                    setNewOptionValue("");
                    setIsModalOpen(true);
                  }}
                >
                  Add new status option
                </Button>
              </>
            )}
          />
        )}
      </td>

      <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700">
        {readOnly ? (
          <span className="text-sm text-gray-600 dark:text-gray-400">{safeBugType || "-"}</span>
        ) : (
          <Select
            value={safeBugType || undefined}
            onChange={(val) => {
              setLocalEntry({ ...localEntry, bugType: val });
              triggerUpdate("bugType", val);
            }}
            placeholder="Bug Type"
            className="w-full"
            size="middle"
            allowClear
            showSearch
            optionLabelProp="value"
            optionFilterProp="label"
            options={(bugTypeOptions || []).map((opt) => ({
              label: (
                <div className="flex justify-between items-center group">
                  <span>{opt.name || opt}</span>
                  {opt.id && (
                    <Trash2 
                      size={14} 
                      className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity" 
                      onClick={(e) => {
                        e.stopPropagation();
                        Modal.confirm({
                          title: 'Delete Option',
                          content: `Are you sure you want to delete "${opt.name || opt}"?`,
                          okText: 'Delete',
                          cancelText: 'Cancel',
                          okType: 'danger',
                          centered: true,
                          onOk: () => onDeleteBugTypeOption(opt.id)
                        });
                      }}
                    />
                  )}
                </div>
              ),
              value: opt.name || opt,
              searchLabel: opt.name || opt
            }))}
            filterOption={(input, option) =>
              (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
            }
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                <Button 
                  type="text" 
                  icon={<Plus size={14}/>} 
                  className="w-full text-left flex items-center gap-2 justify-start px-3 py-1.5 hover:text-emerald-600 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalType("bugType");
                    setNewOptionValue("");
                    setIsModalOpen(true);
                  }}
                >
                  Add new bug type option
                </Button>
              </>
            )}
          />
        )}
      </td>

      <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-700">
        <label className="inline-flex items-center justify-center cursor-pointer">
          <input
            type="checkbox"
            checked={localEntry.isValid === true}
            onChange={(e) => handleValidCheck(e.target.checked)}
            disabled={readOnly}
            className="sr-only"
          />
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
              localEntry.isValid === true
                ? "bg-emerald-500 border-emerald-500 scale-110 shadow-md"
                : "border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:scale-105"
            } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {localEntry.isValid === true && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
      </td>

      <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-gray-700">
        <label className="inline-flex items-center justify-center cursor-pointer">
          <input
            type="checkbox"
            checked={localEntry.isValid === false}
            onChange={(e) => handleInvalidCheck(e.target.checked)}
            disabled={readOnly}
            className="sr-only"
          />
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
              localEntry.isValid === false
                ? "bg-red-500 border-red-500 scale-110 shadow-md"
                : "border-gray-300 dark:border-gray-600 hover:border-red-400 hover:scale-105"
            } ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {localEntry.isValid === false && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        </label>
      </td>

      {!readOnly && (
        <td className="px-3 py-3 text-center">
          <button
            onClick={() => {
              Modal.confirm({
                title: 'Delete Task',
                content: 'Are you sure you want to delete this task? This action cannot be undone.',
                okText: 'Delete',
                cancelText: 'Cancel',
                okType: 'danger',
                centered: true,
                onOk: () => onDelete(entry.id)
              });
            }}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:scale-110"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </td>
      )}
      {!readOnly && (
        <Modal
          title={`Add New ${modalType === "type" ? "Type" : modalType === "status" ? "Status" : "Bug Type"} Option`}
          open={isModalOpen}
          onOk={handleAddOption}
          onCancel={() => setIsModalOpen(false)}
          okText="Add Option"
          okButtonProps={{ className: "bg-emerald-600 hover:bg-emerald-700" }}
          centered
          destroyOnHidden
        >
          <div className="py-4">
            <Input 
              ref={inputRef}
              placeholder="Enter option name..." 
              value={newOptionValue} 
              onChange={(e) => setNewOptionValue(e.target.value)} 
              onPressEnter={handleAddOption}
              autoFocus
            />
          </div>
        </Modal>
      )}
    </tr>
  );
}