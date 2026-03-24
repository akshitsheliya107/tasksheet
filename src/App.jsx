import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ConfigProvider } from "antd";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";
import LoadingSpinner from "./components/LoadingSpinner";
import {
  useTasks,
  useDiscussion,
  useTesting,
  useOptions,
  useSnapshots,
} from "./hooks/useSupabase";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
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
    updateDiscussion,
  } = useDiscussion();

  const {
    testing,
    loading: testingLoading,
    updateTesting,
    addBug,
    updateBug,
    deleteBug,
  } = useTesting();

  const {
    typeOptions,
    statusOptions,
    bugTypeOptions,
    loading: optionsLoading,
    addTypeOption,
    updateTypeOption,
    deleteTypeOption,
    addStatusOption,
    updateStatusOption,
    deleteStatusOption,
    addBugTypeOption,
    updateBugTypeOption,
    deleteBugTypeOption,
  } = useOptions();

  const { saveSnapshot } = useSnapshots();

  const isLoading =
    tasksLoading || discussionLoading || testingLoading || optionsLoading;

  const antdTheme = {
    token: {
      colorPrimary: "#10b981",
      borderRadius: 8,
      fontSize: 14,
      controlHeight: 36,
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

  if (isLoading) {
    return <LoadingSpinner message="Loading your workspace..." />;
  }

  const renderView = () => {
    switch (activeView) {
      case "history":
        return <HistoryView theme={theme} />;
      case "settings":
        return <SettingsView theme={theme} onThemeChange={setTheme} />;
      default:
        return (
          <Dashboard
            tasks={tasks}
            discussion={discussion}
            testing={testing}
            typeOptions={typeOptions}
            statusOptions={statusOptions}
            bugTypeOptions={bugTypeOptions}
            onCreateTask={createTask}
            onCreateDefaultTasks={createDefaultTasks}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onUpdateDiscussion={updateDiscussion}
            onUpdateTesting={updateTesting}
            onAddBug={addBug}
            onUpdateBug={updateBug}
            onDeleteBug={deleteBug}
            onAddTypeOption={addTypeOption}
            onUpdateTypeOption={updateTypeOption}
            onDeleteTypeOption={deleteTypeOption}
            onAddStatusOption={addStatusOption}
            onUpdateStatusOption={updateStatusOption}
            onDeleteStatusOption={deleteStatusOption}
            onAddBugTypeOption={addBugTypeOption}
            onUpdateBugTypeOption={updateBugTypeOption}
            onDeleteBugTypeOption={deleteBugTypeOption}
            onRefresh={fetchTasks}
            onSaveSnapshot={saveSnapshot}
            theme={theme}
          />
        );
    }
  };

  return (
    <ConfigProvider theme={antdTheme}>
      <div className="min-h-screen bg-gray-100">
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
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeView={activeView}
          onViewChange={setActiveView}
          theme={theme}
          onThemeChange={setTheme}
        />

        <main
          className={`transition-all duration-300 min-h-screen ${
            sidebarOpen ? "ml-60" : "ml-16"
          }`}
        >
          <div className="p-6">{renderView()}</div>
        </main>
      </div>
    </ConfigProvider>
  );
}

export default App;
