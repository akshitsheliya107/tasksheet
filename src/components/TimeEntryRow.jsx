import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Select } from "antd";
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
}) {
  const [localHrs, setLocalHrs] = useState(String(entry.hrs || 0));
  const [localMin, setLocalMin] = useState(String(entry.min || 0));
  const [localEntry, setLocalEntry] = useState(entry);

  useEffect(() => {
    setLocalEntry(entry);
    setLocalHrs(String(entry.hrs || 0));
    setLocalMin(String(entry.min || 0));
  }, [entry]);

  const calculateTotals = (hrs, min) => {
    const h = Number(hrs) || 0;
    const m = Number(min) || 0;
    const totalMinutes = h * 60 + m;
    const finalTime = Number((totalMinutes / 60).toFixed(2));
    return { totalMinutes, finalTime };
  };

  // ✅ FIXED: Increased debounce to 600ms to prevent UI freezing during typing/pasting
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

  const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";
  const { totalMinutes, finalTime } = calculateTotals(localHrs, localMin);

  return (
    <tr className={`${rowBg} hover:bg-emerald-50/50 transition-all duration-200 animate-fadeIn`}>
      <td className="px-3 py-3 border-r border-gray-200">
        <input
          type="text"
          value={localEntry.date || ""}
          onChange={(e) => {
            setLocalEntry({ ...localEntry, date: e.target.value });
            triggerUpdate("date", e.target.value);
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
          placeholder="DD/MM/YYYY"
          disabled={readOnly}
        />
      </td>

      {/* ✅ FIXED: Lag-free CU Link input */}
      <td className="px-3 py-3 border-r border-gray-200">
        {readOnly ? (
          localEntry.cuLink ? (
            <a href={localEntry.cuLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs break-all">
              {localEntry.cuLink}
            </a>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )
        ) : (
          <input
            type="text"
            value={localEntry.cuLink || ""}
            onChange={(e) => {
              setLocalEntry({ ...localEntry, cuLink: e.target.value });
              triggerUpdate("cuLink", e.target.value);
            }}
            className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
            placeholder="Paste CU Link..."
            disabled={readOnly}
          />
        )}
      </td>

      {/* ✅ FIXED: Lag-free Task Description input */}
      <td className="px-3 py-3 border-r border-gray-200">
        <textarea
          value={localEntry.task || ""}
          onChange={(e) => {
            setLocalEntry({ ...localEntry, task: e.target.value });
            triggerUpdate("task", e.target.value);
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-none transition-all duration-200"
          placeholder="Enter task description..."
          rows={2}
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        <input
          type="text"
          inputMode="numeric"
          value={localHrs}
          onChange={(e) => handleNumericChange("hrs", e.target.value)}
          onBlur={() => handleBlur("hrs")}
          onKeyDown={(e) => handleKeyDown("hrs", e)}
          className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all duration-200"
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        <input
          type="text"
          inputMode="numeric"
          value={localMin}
          onChange={(e) => handleNumericChange("min", e.target.value)}
          onBlur={() => handleBlur("min")}
          onKeyDown={(e) => handleKeyDown("min", e)}
          className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all duration-200"
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 text-center border-r border-gray-200">
        <span className="text-sm font-semibold text-gray-700">{totalMinutes}</span>
      </td>

      <td className="px-3 py-3 text-center border-r border-gray-200">
        <span className="text-sm font-bold text-emerald-600">{finalTime}</span>
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        {readOnly ? (
          <span className="text-sm text-gray-600">{localEntry.type || "-"}</span>
        ) : (
          <Select
            value={localEntry.type || undefined}
            onChange={(val) => {
              setLocalEntry({ ...localEntry, type: val });
              triggerUpdate("type", val);
            }}
            placeholder="Select Type"
            className="w-full"
            size="middle"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {typeOptions.map((option) => (
              <Select.Option key={option} value={option}>{option}</Select.Option>
            ))}
          </Select>
        )}
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        {readOnly ? (
          <span className="text-sm text-gray-600">{localEntry.status || "-"}</span>
        ) : (
          <Select
            value={localEntry.status || undefined}
            onChange={(val) => {
              setLocalEntry({ ...localEntry, status: val });
              triggerUpdate("status", val);
            }}
            placeholder="Select Status"
            className="w-full"
            size="middle"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {statusOptions.map((option) => (
              <Select.Option key={option} value={option}>{option}</Select.Option>
            ))}
          </Select>
        )}
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        {readOnly ? (
          <span className="text-sm text-gray-600">{localEntry.bugType || "-"}</span>
        ) : (
          <Select
            value={localEntry.bugType || undefined}
            onChange={(val) => {
              setLocalEntry({ ...localEntry, bugType: val });
              triggerUpdate("bugType", val);
            }}
            placeholder="Bug Type"
            className="w-full"
            size="middle"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {bugTypeOptions.map((option) => (
              <Select.Option key={option} value={option}>{option}</Select.Option>
            ))}
          </Select>
        )}
      </td>

      <td className="px-3 py-3 text-center border-r border-gray-200">
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
                : "border-gray-300 hover:border-emerald-400 hover:scale-105"
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

      <td className="px-3 py-3 text-center border-r border-gray-200">
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
                : "border-gray-300 hover:border-red-400 hover:scale-105"
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
            onClick={() => onDelete(entry.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </td>
      )}
    </tr>
  );
}