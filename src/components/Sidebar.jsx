import {
  LayoutDashboard,
  History,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Settings,
  Search,
} from "lucide-react";

export default function Sidebar({
  isOpen,
  onToggle,
  activeView,
  onViewChange,
}) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "keka_timer", label: "Keka Timer", icon: Clock },
    { id: "clickup_settings", label: "ClickUp Settings", icon: Settings },
    { id: "clickup_discovery", label: "ClickUp Discovery", icon: Search },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white transition-all duration-300 z-40 shadow-xl dark:shadow-2xl border-r border-gray-200 dark:border-gray-700 ${
        isOpen ? "w-60" : "w-16"
      }`}
    >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Clock size={20} className="text-white" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-base text-gray-900 dark:text-white">TimeTracker</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Daily Reports</p>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:scale-110 text-gray-700 dark:text-gray-300"
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
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:scale-105"
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
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