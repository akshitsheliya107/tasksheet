import { useState } from "react";
import { Modal, Input, InputNumber, message } from "antd";
import { Calendar, Clock, FileText } from "lucide-react";

const { TextArea } = Input;

export default function AddTaskModal({ isOpen, onClose, onAdd }) {
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState({
    date: new Date().toLocaleDateString(),
    task: "",
    hrs: 0,
    min: 0,
  });

  const handleSubmit = async () => {
    if (!task.task.trim()) {
      message.warning("Please enter a task description");
      return;
    }

    setLoading(true);
    try {
      await onAdd(task);
      setTask({
        date: new Date().toLocaleDateString(),
        task: "",
        hrs: 0,
        min: 0,
      });
      onClose();
      message.success("Task added successfully");
    } catch (error) {
      message.error("Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-emerald-600" />
          <span>Add New Task</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Add Task"
      okButtonProps={{
        loading,
        className: "bg-emerald-600 hover:bg-emerald-700",
      }}
      cancelText="Cancel"
      centered
      destroyOnClose
    >
      <div className="space-y-4 py-4">
        {/* Date */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Calendar size={14} />
            Date
          </label>
          <Input
            value={task.date}
            onChange={(e) => setTask({ ...task, date: e.target.value })}
            placeholder="DD/MM/YYYY"
          />
        </div>

        {/* Task Description */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <FileText size={14} />
            Task Description <span className="text-red-500">*</span>
          </label>
          <TextArea
            value={task.task}
            onChange={(e) => setTask({ ...task, task: e.target.value })}
            placeholder="Enter task description..."
            rows={4}
          />
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Clock size={14} />
              Hours
            </label>
            <InputNumber
              min={0}
              value={task.hrs}
              onChange={(value) => setTask({ ...task, hrs: value || 0 })}
              className="w-full"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Clock size={14} />
              Minutes
            </label>
            <InputNumber
              min={0}
              max={59}
              value={task.min}
              onChange={(value) => setTask({ ...task, min: value || 0 })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
