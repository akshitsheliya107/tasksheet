import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Modal, message } from "antd";

export default function DropdownWithCRUD({
  value,
  options = [],
  onChange,
  onAdd,
  onUpdate,
  onDelete,
  placeholder = "Select...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsManaging(false);
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddOption = async () => {
    if (newOption.trim() && !options.find((o) => o.name === newOption.trim())) {
      await onAdd(newOption.trim());
      setNewOption("");
      message.success("Option added");
    }
  };

  const handleDeleteOption = async (id, name, e) => {
    e.stopPropagation();
    Modal.confirm({
      title: "Delete Option",
      content: `Are you sure you want to delete "${name}"?`,
      okText: "Delete",
      cancelText: "Cancel",
      okType: "danger",
      centered: true,
      onOk: async () => {
        await onDelete(id);
        if (value === name) onChange("");
        message.success("Option deleted");
      },
    });
  };

  const handleEditOption = (option, e) => {
    e.stopPropagation();
    setEditingId(option.id);
    setEditValue(option.name);
  };

  const handleSaveEdit = async (id, oldName) => {
    if (editValue.trim()) {
      await onUpdate(id, editValue.trim());
      if (value === oldName) onChange(editValue.trim());
      message.success("Option updated");
    }
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 text-sm border rounded bg-white transition-colors ${
          isOpen
            ? "border-emerald-500 ring-1 ring-emerald-500"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`truncate ${value ? "text-gray-700" : "text-gray-400"}`}
        >
          {value || placeholder}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span
            onClick={(e) => {
              e.stopPropagation();
              setIsManaging(!isManaging);
              setIsOpen(true);
            }}
            className="p-0.5 hover:bg-gray-100 rounded"
          >
            <Pencil size={12} className="text-gray-400" />
          </span>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
          {isManaging && (
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddOption()}
                  placeholder="Add new..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddOption();
                  }}
                  className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center gap-2 px-2 py-2 hover:bg-gray-50 ${
                    value === option.name
                      ? "bg-emerald-50 border-l-2 border-emerald-500"
                      : ""
                  }`}
                >
                  {editingId === option.id ? (
                    <div className="flex-1 flex gap-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit(option.id, option.name);
                        }}
                        className="p-1 bg-emerald-500 text-white rounded"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="p-1 bg-gray-400 text-white rounded"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="flex-1 text-sm text-gray-700 cursor-pointer"
                        onClick={() => {
                          onChange(option.name);
                          if (!isManaging) setIsOpen(false);
                        }}
                      >
                        {option.name}
                      </span>
                      {isManaging && (
                        <div className="flex gap-0.5">
                          <button
                            onClick={(e) => handleEditOption(option, e)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleDeleteOption(option.id, option.name, e)
                            }
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
