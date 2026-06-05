import { useState, useEffect, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import { ConfigProvider, DatePicker, message, Popconfirm, theme as antdThemeLib } from "antd";
import dayjs from "dayjs";
import { Calendar, ChevronLeft, ChevronRight, LogOut, Moon, Sun } from "lucide-react";

import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import History from "./components/History";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import { useAuth } from "./context/AuthContext";

import LoadingSpinner from "./components/LoadingSpinner";
import {
  useTasks,
  useDiscussion,
  useTesting,
  useSnapshots,
  useOptions,
  useMrIssue,
} from "./hooks/useSupabase";
import { workspaceAPI, setUserId } from "./services/api";

function App() {
  const { currentUser, logout } = useAuth();
  const [authView, setAuthView] = useState("login");

  useEffect(() => {
    if (currentUser) {
      setUserId(currentUser.uid);
    }
  }, [currentUser]);

  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeDate, setActiveDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [isSwapping, setIsSwapping] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("dark-mode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("dark-mode", isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "emerald";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const {
    tasks,
    loading: tasksLoading,
    fetchTasks,
    createTask,
    createDefaultTasks,
    updateTask,
    deleteTask,
  } = useTasks();

  const {
    discussion,
    loading: discussionLoading,
    fetchDiscussion,
    updateDiscussion,
  } = useDiscussion();

  const {
    mrIssue,
    loading: mrIssueLoading,
    fetchMrIssue,
    updateMrIssue,
  } = useMrIssue();

  const {
    testing,
    loading: testingLoading,
    fetchTesting,
    updateTesting,
    addBug,
    updateBug,
    deleteBug,
  } = useTesting();

  const { snapshots, deleteSnapshot, saveSnapshot } = useSnapshots();

  const {
    typeOptions,
    statusOptions,
    bugTypeOptions,
    addTypeOption,
    deleteTypeOption,
    addStatusOption,
    deleteStatusOption,
    addBugTypeOption,
    deleteBugTypeOption,
    loading: optionsLoading
  } = useOptions();

  const isLoading = tasksLoading || discussionLoading || testingLoading || optionsLoading || mrIssueLoading;

  const antdTheme = {
    algorithm: isDarkMode ? antdThemeLib.darkAlgorithm : antdThemeLib.defaultAlgorithm,
    token: {
      colorPrimary: "#10b981",
      borderRadius: 8,
      fontSize: 14,
      controlHeight: 36,
      colorBgBase: isDarkMode ? "#1f2937" : "#ffffff",
      colorTextBase: isDarkMode ? "#f3f4f6" : "#1f2937",
    },
    components: {
      Select: {
        controlHeight: 36,
        borderRadius: 8,
      },
      Input: {
        controlHeight: 36,
        borderRadius: 8,
      },
      Button: {
        controlHeight: 40,
        borderRadius: 10,
        fontWeight: 600,
      },
      Modal: {
        borderRadiusLG: 16,
      },
    },
  };

  const handleDateChange = useCallback(async (newDateStr) => {
    if (newDateStr === activeDate) return;
    setIsSwapping(true);
    try {
      // 1. Save current workspace as snapshot automatically
      // Need to dynamically calculate totalStats for snapshot like Dashboard does
      const tasksToSave = tasks;
      const discussionToSave = discussion;
      const mrIssueToSave = mrIssue;
      const testingToSave = testing;

      // Calculate minimal stats just for the snapshot reference
      let validTime = 0, invalidTime = 0, totalMin = 0;
      tasksToSave.forEach(t => {
        const h = Number(t.hrs) || 0;
        const m = Number(t.min) || 0;
        const tMin = (h > 0 || m > 0) ? h * 60 + m : (t.totalMin || t.total_min || 0);
        totalMin += tMin;
        const finalTime = Number((tMin / 60).toFixed(2));
        const isValid = t.is_valid !== undefined ? t.is_valid : t.isValid;
        if (isValid === true) validTime += finalTime;
        else if (isValid === false) invalidTime += finalTime;
      });

      const dMin = (discussionToSave.hrs || 0) * 60 + (discussionToSave.min || 0);
      const mrMin = (mrIssueToSave.hrs || 0) * 60 + (mrIssueToSave.min || 0);
      const testMin = (testingToSave.testingTime?.hrs || 0) * 60 + (testingToSave.testingTime?.min || 0);
      const grandTotalTime = ((totalMin + dMin + mrMin + testMin) / 60).toFixed(2);

      const snapshotData = {
        tasks: tasksToSave,
        discussion: discussionToSave,
        mrIssue: mrIssueToSave,
        testing: testingToSave,
        stats: { grandTotalTime, validTime, invalidTime }
      };

      // Ensure saveSnapshot runs completely
      await saveSnapshot(snapshotData, activeDate);

      // 2. Load new workspace
      await workspaceAPI.loadWorkspace(newDateStr);
      
      // 3. Trigger context updates
      setActiveDate(newDateStr);
      await Promise.all([
        fetchTasks(),
        fetchDiscussion(),
        fetchMrIssue(),
        fetchTesting()
      ]);

      message.success(`Switched workspace to ${newDateStr}`);
    } catch (err) {
      console.error(err);
      message.error("Failed to switch date");
    } finally {
      setIsSwapping(false);
    }
  }, [activeDate, tasks, discussion, mrIssue, testing, saveSnapshot, fetchTasks, fetchDiscussion, fetchMrIssue, fetchTesting]);

  const changeDay = (offset) => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + offset);
    handleDateChange(d.toISOString().split("T")[0]);
  };

  const setToday = () => {
    handleDateChange(new Date().toISOString().split("T")[0]);
  };

  if (!currentUser) {
    return (
      <ConfigProvider theme={antdTheme}>
        <Toaster position="top-right" />
        {authView === "login" ? (
          <Login onSwitchToSignup={() => setAuthView("signup")} />
        ) : (
          <Signup onSwitchToLogin={() => setAuthView("login")} />
        )}
      </ConfigProvider>
    );
  }

  if (isLoading || isSwapping) {
    return <LoadingSpinner message={isSwapping ? "Switching workspace..." : "Loading your workspace..."} />;
  }

  const renderView = () => {
    switch (activeView) {
      case "history":
        return (
          <History
            snapshots={snapshots}
            onDeleteSnapshot={deleteSnapshot}
            onSaveSnapshot={saveSnapshot}
          />
        );
      case "dashboard":
      default:
        return (
          <Dashboard
            tasks={tasks}
            discussion={discussion}
            mrIssue={mrIssue}
            testing={testing}
            typeOptions={typeOptions}
            statusOptions={statusOptions}
            bugTypeOptions={bugTypeOptions}
            onAddTypeOption={addTypeOption}
            onDeleteTypeOption={deleteTypeOption}
            onAddStatusOption={addStatusOption}
            onDeleteStatusOption={deleteStatusOption}
            onAddBugTypeOption={addBugTypeOption}
            onDeleteBugTypeOption={deleteBugTypeOption}
            onCreateTask={createTask}
            onCreateDefaultTasks={createDefaultTasks}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onUpdateDiscussion={updateDiscussion}
            onUpdateMrIssue={updateMrIssue}
            onUpdateTesting={updateTesting}
            onAddBug={addBug}
            onUpdateBug={updateBug}
            onDeleteBug={deleteBug}
            onRefresh={fetchTasks}
            onSaveSnapshot={saveSnapshot}
            theme={theme}
          />
        );
    }
  };

  return (
    <ConfigProvider theme={antdTheme}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2937",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              padding: "16px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />

        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        <main className={`transition-all duration-300 flex flex-col ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
          {/* Global Top Header */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <button 
                  onClick={() => changeDay(-1)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-gray-800 rounded transition-all"
                >
                  Yesterday
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                <button 
                  onClick={setToday}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${activeDate === new Date().toISOString().split("T")[0] ? "bg-emerald-600 text-white shadow" : "text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-gray-800"}`}
                >
                  Today
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                <button 
                  onClick={() => changeDay(1)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-white rounded transition-all"
                >
                  Tomorrow
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Workspace:</span>
              <DatePicker 
                value={dayjs(activeDate)} 
                onChange={(date) => {
                  if (date) handleDateChange(date.format("YYYY-MM-DD"));
                }}
                allowClear={false}
                className="w-40"
              />
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>
              <Popconfirm
                title="Log Out"
                description="Are you sure you want to log out?"
                onConfirm={async () => {
                  try {
                    await logout();
                    message.success("Logged out successfully");
                  } catch(e) {
                    message.error("Failed to log out");
                  }
                }}
                okText="Yes"
                cancelText="No"
                placement="bottomRight"
              >
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </Popconfirm>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-x-hidden">{renderView()}</div>
        </main>
      </div>
    </ConfigProvider>
  );
}

export default App;
