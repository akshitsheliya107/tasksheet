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
  const [localEntry, setLocalEntry] = useState(entry);

  useEffect(() => {
    setLocalEntry(entry);
  }, [entry]);

  const totalMinutes =
    Number(localEntry.hrs || 0) * 60 + Number(localEntry.min || 0);
  const finalTime = (totalMinutes / 60).toFixed(2);

  const debouncedUpdate = useCallback(
    debounce((updatedEntry) => {
      if (!readOnly && onUpdate) {
        onUpdate(entry.id, updatedEntry);
      }
    }, 500),
    [entry.id, onUpdate, readOnly]
  );

  const handleChange = (field, value) => {
    if (readOnly) return;

    const updated = { ...localEntry, [field]: value };
    const newTotalMin =
      Number(updated.hrs || 0) * 60 + Number(updated.min || 0);
    const newFinalTime = Number((newTotalMin / 60).toFixed(2));

    updated.totalMin = newTotalMin;
    updated.finalTime = newFinalTime;
    updated.validTime = updated.isValid === true ? newFinalTime : 0;
    updated.invalidTime = updated.isValid === false ? newFinalTime : 0;

    setLocalEntry(updated);
    debouncedUpdate(updated);
  };

  const handleValidCheck = (checked) => {
    handleChange("isValid", checked ? true : null);
  };

  const handleInvalidCheck = (checked) => {
    handleChange("isValid", checked ? false : null);
  };

  const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";

  return (
    <tr
      className={`${rowBg} hover:bg-emerald-50/50 transition-all duration-200 animate-fadeIn`}
    >
      <td className="px-3 py-3 border-r border-gray-200">
        <input
          type="text"
          value={localEntry.date || ""}
          onChange={(e) => handleChange("date", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
          placeholder="DD/MM/YYYY"
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        <textarea
          value={localEntry.task || ""}
          onChange={(e) => handleChange("task", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-none transition-all duration-200"
          placeholder="Enter task description..."
          rows={2}
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        <input
          type="number"
          min="0"
          value={localEntry.hrs || 0}
          onChange={(e) => handleChange("hrs", Number(e.target.value) || 0)}
          className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all duration-200"
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        <input
          type="number"
          min="0"
          max="59"
          value={localEntry.min || 0}
          onChange={(e) => handleChange("min", Number(e.target.value) || 0)}
          className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all duration-200"
          disabled={readOnly}
        />
      </td>

      <td className="px-3 py-3 text-center border-r border-gray-200">
        <span className="text-sm font-semibold text-gray-700">
          {totalMinutes}
        </span>
      </td>

      <td className="px-3 py-3 text-center border-r border-gray-200">
        <span className="text-sm font-bold text-emerald-600">{finalTime}</span>
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        {readOnly ? (
          <span className="text-sm text-gray-600">
            {localEntry.type || "-"}
          </span>
        ) : (
          <Select
            value={localEntry.type || undefined}
            onChange={(val) => handleChange("type", val)}
            placeholder="Select Type"
            className="w-full"
            size="middle"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {typeOptions.map((option) => (
              <Select.Option key={option.id} value={option.name}>
                {option.name}
              </Select.Option>
            ))}
          </Select>
        )}
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        {readOnly ? (
          <span className="text-sm text-gray-600">
            {localEntry.status || "-"}
          </span>
        ) : (
          <Select
            value={localEntry.status || undefined}
            onChange={(val) => handleChange("status", val)}
            placeholder="Select Status"
            className="w-full"
            size="middle"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {statusOptions.map((option) => (
              <Select.Option key={option.id} value={option.name}>
                {option.name}
              </Select.Option>
            ))}
          </Select>
        )}
      </td>

      <td className="px-3 py-3 border-r border-gray-200">
        {readOnly ? (
          <span className="text-sm text-gray-600">
            {localEntry.bugType || "-"}
          </span>
        ) : (
          <Select
            value={localEntry.bugType || undefined}
            onChange={(val) => handleChange("bugType", val)}
            placeholder="Bug Type"
            className="w-full"
            size="middle"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {bugTypeOptions.map((option) => (
              <Select.Option key={option.id} value={option.name}>
                {option.name}
              </Select.Option>
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
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
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
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
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
