import {
  LayoutDashboard,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
} from "lucide-react";

export default function Sidebar({
  isOpen,
  onToggle,
  activeView,
  onViewChange,
}) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-40 shadow-2xl ${
        isOpen ? "w-60" : "w-16"
      }`}
    >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-700">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Clock size={20} className="text-white" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-base">TimeTracker</h1>
            <p className="text-xs text-gray-400">Daily Reports</p>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700 hover:bg-gray-700 transition-all duration-200 shadow-lg hover:scale-110"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <nav className="p-3 space-y-2 mt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg scale-105"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white hover:scale-105"
              }`}
            >
              <Icon size={20} />
              {isOpen && (
                <span className="text-sm font-semibold">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {isOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Calendar size={14} />
            <span>
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
