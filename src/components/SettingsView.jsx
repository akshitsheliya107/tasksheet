import { useState } from "react";
import { Palette, Bell, Download, Trash2, Database, Info } from "lucide-react";
import { Switch, Modal, message } from "antd";

export default function SettingsView({ theme, onThemeChange }) {
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const themes = [
    { id: "emerald", label: "Emerald", color: "bg-emerald-500" },
    { id: "blue", label: "Blue", color: "bg-blue-500" },
    { id: "purple", label: "Purple", color: "bg-purple-500" },
    { id: "rose", label: "Rose", color: "bg-rose-500" },
    { id: "amber", label: "Amber", color: "bg-amber-500" },
  ];

  const handleClearData = () => {
    Modal.confirm({
      title: "Clear All Data",
      content:
        "Are you sure you want to clear all data? This action cannot be undone.",
      okText: "Clear All",
      cancelText: "Cancel",
      okType: "danger",
      centered: true,
      onOk: () => {
        message.success("Data cleared successfully");
      },
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Customize your experience</p>
      </div>
      {/* Theme */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Palette size={18} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Theme</h3>
            <p className="text-xs text-gray-500">Choose your color theme</p>
          </div>
        </div>

        <div className="flex gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`w-10 h-10 rounded-full ${
                t.color
              } transition-transform ${
                theme === t.id
                  ? "ring-2 ring-offset-2 ring-gray-800 scale-110"
                  : "hover:scale-105"
              }`}
              title={t.label}
            />
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Preferences</h3>
            <p className="text-xs text-gray-500">Manage your preferences</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-700 text-sm">Notifications</p>
              <p className="text-xs text-gray-500">
                Get notified about updates
              </p>
            </div>
            <Switch
              checked={notifications}
              onChange={setNotifications}
              className={notifications ? "bg-emerald-500" : ""}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-700 text-sm">Auto-save</p>
              <p className="text-xs text-gray-500">
                Automatically save changes
              </p>
            </div>
            <Switch
              checked={autoSave}
              onChange={setAutoSave}
              className={autoSave ? "bg-emerald-500" : ""}
            />
          </div>
        </div>
      </div>
      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Database size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Data Management</h3>
            <p className="text-xs text-gray-500">Export or clear your data</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} className="text-emerald-600" />
            <div className="text-left">
              <p className="font-medium text-gray-700 text-sm">Export</p>
              <p className="text-xs text-gray-500">Download as JSON</p>
            </div>
          </button>

          <button
            onClick={handleClearData}
            className="flex items-center gap-2 p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} className="text-red-600" />
            <div className="text-left">
              <p className="font-medium text-red-700 text-sm">Clear Data</p>
              <p className="text-xs text-red-500">Delete all data</p>
            </div>
          </button>
        </div>
      </div>
      {/* About */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Info size={18} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">About</h3>
            <p className="text-xs text-gray-500">
              Version 2.0.0 - Daily Time Tracking App
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
