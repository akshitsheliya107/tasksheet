import { useState, useEffect, useCallback } from "react";
import {
  tasksAPI,
  discussionAPI,
  testingAPI,
  bugsAPI,
  optionsAPI,
  snapshotsAPI,
  mrIssueAPI,
} from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import debounce from "lodash.debounce";

// ════════════════════════════════════════════════════════════
// TASKS HOOK
// ════════════════════════════════════════════════════════════
export function useTasks() {
  const { currentUser, userReady } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

const transformTask = (task) => ({
  id: task.id,
  date: task.date || "",
  task: task.task || "",
  hrs: task.hrs || 0,
  min: task.min || 0,
  totalMin: task.total_min !== undefined ? task.total_min : task.totalMin || 0,
  finalTime: task.final_time !== undefined ? task.final_time : task.finalTime || 0,
  cuLink: task.cu_link !== undefined ? task.cu_link : task.cuLink || "",
  type: task.type || "",
  status: task.status || "",
  bugType: task.bug_type !== undefined ? task.bug_type : task.bugType || "",
  reporter: task.reporter || "",
  reporterTime: task.reporter_time !== undefined ? task.reporter_time : task.reporterTime || "",
  isValid: task.is_valid !== undefined ? task.is_valid : task.isValid !== undefined ? task.isValid : null,
  validTime: task.valid_time !== undefined ? task.valid_time : task.validTime || 0,
  invalidTime: task.invalid_time !== undefined ? task.invalid_time : task.invalidTime || 0,
  // ✅ Preserve ClickUp metadata (don't strip these!)
  clickup_task_id: task.clickup_task_id || "",
  clickup_list_name: task.clickup_list_name || "",
  source: task.source || "",
  synced_at: task.synced_at || null,
  manually_edited: task.manually_edited || false,
  // Also keep cu_link snake_case version for compatibility
  cu_link: task.cu_link || task.cuLink || "",
});

  const fetchTasks = useCallback(async () => {
    if (!userReady) {
      console.log("[useTasks] Waiting for user...");
      return;
    }
    try {
      setLoading(true);
      const data = await tasksAPI.getAll();
      setTasks(data.map(transformTask));
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [userReady]);

  const createTask = async (task) => {
    try {
      const data = await tasksAPI.create(task);
      const newTask = transformTask(data);
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (err) {
      toast.error("Failed to create task");
      throw err;
    }
  };

  const createDefaultTasks = async (count = 10) => {
    try {
      const now = Date.now();
      const defaultTasks = Array(count).fill(null).map((_, i) => ({
        id: now + (i * 10),
        date: new Date().toLocaleDateString(),
        task: "",
        hrs: 0,
        min: 0,
      }));
      await tasksAPI.createMultiple(defaultTasks);
      await fetchTasks();
    } catch (err) {
      toast.error("Failed to create default tasks");
      throw err;
    }
  };

  const updateTask = async (id, task) => {
    try {
      await tasksAPI.update(id, task);
      setTasks((prev) => prev.map((t) => {
        if (t.id !== id) return t;
        
        const editableFields = ['date', 'task', 'hrs', 'min', 'cuLink', 'cu_link', 'type', 'status', 'bugType', 'bug_type', 'reporter', 'reporterTime', 'reporter_time'];
        let isManualEdit = false;
        
        for (const field of editableFields) {
          if (task[field] !== undefined && String(task[field] ?? '') !== String(t[field] ?? '')) {
            isManualEdit = true;
            break;
          }
        }
        
        return { 
          ...t, 
          ...task,
          // Preserve ClickUp metadata in local state
          clickup_task_id: t.clickup_task_id || task.clickup_task_id || "",
          clickup_list_name: t.clickup_list_name || task.clickup_list_name || "",
          source: t.source || task.source || "",
          synced_at: t.synced_at || task.synced_at || null,
          // Auto-flag manual edit
          manually_edited: task.manually_edited !== undefined 
            ? task.manually_edited 
            : (isManualEdit ? true : (t.manually_edited || false)),
        };
      }));
    } catch (err) {
      toast.error("Failed to update task");
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      await tasksAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      toast.error("Failed to delete task");
      throw err;
    }
  };

  const deleteAllTasks = async () => {
    try {
      const emptyTasks = await tasksAPI.deleteAll();
      setTasks(emptyTasks.map(transformTask));
    } catch (err) {
      toast.error("Failed to delete all tasks");
      throw err;
    }
  };

  useEffect(() => {
    if (currentUser && userReady) {
      fetchTasks();
    } else if (!currentUser) {
      setTasks([]);
      setLoading(false);
    }
  }, [fetchTasks, currentUser, userReady]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    createDefaultTasks,
    updateTask,
    deleteTask,
    deleteAllTasks,
    setTasks,
  };
}

// ════════════════════════════════════════════════════════════
// DISCUSSION HOOK
// ════════════════════════════════════════════════════════════
export function useDiscussion() {
  const { currentUser, userReady } = useAuth();
  const [discussion, setDiscussion] = useState({
    id: null, hrs: 0, min: 0, note: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchDiscussion = useCallback(async () => {
    if (!userReady) return;
    try {
      setLoading(true);
      const data = await discussionAPI.get();
      if (data) {
        setDiscussion({
          id: data.id,
          hrs: data.hrs,
          min: data.min,
          note: data.note,
        });
      }
    } catch (err) {
      toast.error("Failed to load discussion");
    } finally {
      setLoading(false);
    }
  }, [userReady]);

  const debouncedUpdate = useCallback(
    debounce(async (id, updated) => {
      try {
        await discussionAPI.update(id, updated);
      } catch (err) {
        toast.error("Failed to update discussion");
      }
    }, 1000),
    []
  );

  const updateDiscussion = (field, value) => {
    let updated;
    if (typeof field === "object") {
      updated = { ...discussion, ...field };
    } else {
      updated = { ...discussion, [field]: value };
    }
    setDiscussion(updated);
    if (discussion.id) {
      debouncedUpdate(discussion.id, updated);
    }
  };

  useEffect(() => {
    if (currentUser && userReady) {
      fetchDiscussion();
    } else if (!currentUser) {
      setDiscussion({ id: null, hrs: 0, min: 0, note: "" });
      setLoading(false);
    }
  }, [fetchDiscussion, currentUser, userReady]);

  return { discussion, loading, fetchDiscussion, updateDiscussion, setDiscussion };
}

// ════════════════════════════════════════════════════════════
// MR ISSUE HOOK
// ════════════════════════════════════════════════════════════
export function useMrIssue() {
  const { currentUser, userReady } = useAuth();
  const [mrIssue, setMrIssue] = useState({
    id: null, hrs: 0, min: 0, note: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchMrIssue = useCallback(async () => {
    if (!userReady) return;
    try {
      setLoading(true);
      const data = await mrIssueAPI.get();
      if (data) {
        setMrIssue({
          id: data.id,
          hrs: data.hrs,
          min: data.min,
          note: data.note,
        });
      }
    } catch (err) {
      toast.error("Failed to load MR Issue");
    } finally {
      setLoading(false);
    }
  }, [userReady]);

  const debouncedUpdate = useCallback(
    debounce(async (id, updated) => {
      try {
        await mrIssueAPI.update(id, updated);
      } catch (err) {
        toast.error("Failed to update MR Issue");
      }
    }, 1000),
    []
  );

  const updateMrIssue = (field, value) => {
    let updated;
    if (typeof field === "object") {
      updated = { ...mrIssue, ...field };
    } else {
      updated = { ...mrIssue, [field]: value };
    }
    setMrIssue(updated);
    if (mrIssue.id) {
      debouncedUpdate(mrIssue.id, updated);
    }
  };

  useEffect(() => {
    if (currentUser && userReady) {
      fetchMrIssue();
    } else if (!currentUser) {
      setMrIssue({ id: null, hrs: 0, min: 0, note: "" });
      setLoading(false);
    }
  }, [fetchMrIssue, currentUser, userReady]);

  return { mrIssue, loading, fetchMrIssue, updateMrIssue, setMrIssue };
}

// ════════════════════════════════════════════════════════════
// TESTING HOOK
// ════════════════════════════════════════════════════════════
export function useTesting() {
  const { currentUser, userReady } = useAuth();
  const [testing, setTesting] = useState({
    id: null,
    testingTime: { hrs: 0, min: 0 },
    testingModule: "",
    testCaseScenario: "",
    bugFoundedModule: "",
    bugs: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchTesting = useCallback(async () => {
    if (!userReady) return;
    try {
      setLoading(true);
      const data = await testingAPI.get();
      if (data) {
        setTesting({
          id: data.id,
          testingTime: { hrs: data.testing_hrs, min: data.testing_min },
          testingModule: data.testing_module || "",
          testCaseScenario: data.test_case_scenario || "",
          bugFoundedModule: data.bug_founded_module || "",
          bugs: data.bugs || [],
        });
      }
    } catch (err) {
      toast.error("Failed to load testing data");
    } finally {
      setLoading(false);
    }
  }, [userReady]);

  const debouncedUpdate = useCallback(
    debounce(async (id, updated) => {
      try {
        await testingAPI.update(id, updated);
      } catch (err) {
        toast.error("Failed to update testing");
      }
    }, 1000),
    []
  );

  const updateTesting = (updates) => {
    const updated = { ...testing, ...updates };
    setTesting(updated);
    if (testing.id) {
      debouncedUpdate(testing.id, updated);
    }
  };

  const addBug = async () => {
    try {
      const newBug = await bugsAPI.create(testing.id, { description: "", url: "" });
      setTesting((prev) => ({ ...prev, bugs: [...prev.bugs, newBug] }));
    } catch (err) {
      toast.error("Failed to add bug");
    }
  };

  const updateBug = async (id, field, value) => {
    const updatedBugs = testing.bugs.map((bug) =>
      bug.id === id ? { ...bug, [field]: value } : bug
    );
    setTesting((prev) => ({ ...prev, bugs: updatedBugs }));
    try {
      const bug = updatedBugs.find((b) => b.id === id);
      await bugsAPI.update(id, bug);
    } catch (err) {
      toast.error("Failed to update bug");
    }
  };

  const deleteBug = async (id) => {
    try {
      await bugsAPI.delete(id);
      setTesting((prev) => ({
        ...prev,
        bugs: prev.bugs.filter((bug) => bug.id !== id),
      }));
    } catch (err) {
      toast.error("Failed to delete bug");
    }
  };

  useEffect(() => {
    if (currentUser && userReady) {
      fetchTesting();
    } else if (!currentUser) {
      setTesting({
        id: null,
        testingTime: { hrs: 0, min: 0 },
        testingModule: "",
        testCaseScenario: "",
        bugFoundedModule: "",
        bugs: [],
      });
      setLoading(false);
    }
  }, [fetchTesting, currentUser, userReady]);

  return {
    testing,
    loading,
    fetchTesting,
    updateTesting,
    addBug,
    updateBug,
    deleteBug,
    setTesting,
  };
}

// ════════════════════════════════════════════════════════════
// OPTIONS HOOK
// ════════════════════════════════════════════════════════════
export function useOptions() {
  const { currentUser, userReady } = useAuth();
  const [typeOptions, setTypeOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [bugTypeOptions, setBugTypeOptions] = useState([]);
  const [reporterOptions, setReporterOptions] = useState([]);
  const [reporterTimeOptions, setReporterTimeOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOptions = useCallback(async () => {
    if (!userReady) return;
    try {
      setLoading(true);
      const [types, statuses, bugTypes, reporters, reporterTimes] = await Promise.all([
        optionsAPI.getTypeOptions(),
        optionsAPI.getStatusOptions(),
        optionsAPI.getBugTypeOptions(),
        optionsAPI.getReporterOptions(),
        optionsAPI.getReporterTimeOptions(),
      ]);
      setTypeOptions(types);
      setStatusOptions(statuses);
      setBugTypeOptions(bugTypes);
      setReporterOptions(reporters);
      setReporterTimeOptions(reporterTimes);
    } catch (err) {
      toast.error("Failed to load options");
    } finally {
      setLoading(false);
    }
  }, [userReady]);

  const addTypeOption = async (name) => {
    try {
      const newOption = await optionsAPI.addTypeOption(name);
      setTypeOptions((prev) => [...prev, newOption]);
    } catch (err) {
      toast.error("Failed to add option");
    }
  };

  const updateTypeOption = async (id, name) => {
    try {
      await optionsAPI.updateTypeOption(id, name);
      setTypeOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, name } : opt)));
    } catch (err) {
      toast.error("Failed to update option");
    }
  };

  const deleteTypeOption = async (id) => {
    try {
      await optionsAPI.deleteTypeOption(id);
      setTypeOptions((prev) => prev.filter((opt) => opt.id !== id));
    } catch (err) {
      toast.error("Failed to delete option");
    }
  };

  const addStatusOption = async (name) => {
    try {
      const newOption = await optionsAPI.addStatusOption(name);
      setStatusOptions((prev) => [...prev, newOption]);
    } catch (err) {
      toast.error("Failed to add option");
    }
  };

  const updateStatusOption = async (id, name) => {
    try {
      await optionsAPI.updateStatusOption(id, name);
      setStatusOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, name } : opt)));
    } catch (err) {
      toast.error("Failed to update option");
    }
  };

  const deleteStatusOption = async (id) => {
    try {
      await optionsAPI.deleteStatusOption(id);
      setStatusOptions((prev) => prev.filter((opt) => opt.id !== id));
    } catch (err) {
      toast.error("Failed to delete option");
    }
  };

  const addBugTypeOption = async (name) => {
    try {
      const newOption = await optionsAPI.addBugTypeOption(name);
      setBugTypeOptions((prev) => [...prev, newOption]);
    } catch (err) {
      toast.error("Failed to add option");
    }
  };

  const updateBugTypeOption = async (id, name) => {
    try {
      await optionsAPI.updateBugTypeOption(id, name);
      setBugTypeOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, name } : opt)));
    } catch (err) {
      toast.error("Failed to update option");
    }
  };

  const deleteBugTypeOption = async (id) => {
    try {
      await optionsAPI.deleteBugTypeOption(id);
      setBugTypeOptions((prev) => prev.filter((opt) => opt.id !== id));
    } catch (err) {
      toast.error("Failed to delete option");
    }
  };

  const addReporterOption = async (name) => {
    try {
      const newOption = await optionsAPI.addReporterOption(name);
      setReporterOptions((prev) => [...prev, newOption]);
    } catch (err) {
      toast.error("Failed to add reporter option");
    }
  };

  const updateReporterOption = async (id, name) => {
    try {
      await optionsAPI.updateReporterOption(id, name);
      setReporterOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, name } : opt)));
    } catch (err) {
      toast.error("Failed to update reporter option");
    }
  };

  const deleteReporterOption = async (id) => {
    try {
      await optionsAPI.deleteReporterOption(id);
      setReporterOptions((prev) => prev.filter((opt) => opt.id !== id));
    } catch (err) {
      toast.error("Failed to delete reporter option");
    }
  };

  const addReporterTimeOption = async (name) => {
    try {
      const newOption = await optionsAPI.addReporterTimeOption(name);
      setReporterTimeOptions((prev) => [...prev, newOption]);
    } catch (err) {
      toast.error("Failed to add reporter time option");
    }
  };

  const updateReporterTimeOption = async (id, name) => {
    try {
      await optionsAPI.updateReporterTimeOption(id, name);
      setReporterTimeOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, name } : opt)));
    } catch (err) {
      toast.error("Failed to update reporter time option");
    }
  };

  const deleteReporterTimeOption = async (id) => {
    try {
      await optionsAPI.deleteReporterTimeOption(id);
      setReporterTimeOptions((prev) => prev.filter((opt) => opt.id !== id));
    } catch (err) {
      toast.error("Failed to delete reporter time option");
    }
  };

  useEffect(() => {
    if (currentUser && userReady) {
      fetchOptions();
    } else if (!currentUser) {
      setTypeOptions([]);
      setStatusOptions([]);
      setBugTypeOptions([]);
      setReporterOptions([]);
      setReporterTimeOptions([]);
      setLoading(false);
    }
  }, [fetchOptions, currentUser, userReady]);

  return {
    typeOptions,
    statusOptions,
    bugTypeOptions,
    reporterOptions,
    reporterTimeOptions,
    loading,
    addTypeOption,
    updateTypeOption,
    deleteTypeOption,
    addStatusOption,
    updateStatusOption,
    deleteStatusOption,
    addBugTypeOption,
    updateBugTypeOption,
    deleteBugTypeOption,
    addReporterOption,
    updateReporterOption,
    deleteReporterOption,
    addReporterTimeOption,
    updateReporterTimeOption,
    deleteReporterTimeOption,
  };
}

// ════════════════════════════════════════════════════════════
// SNAPSHOTS HOOK
// ════════════════════════════════════════════════════════════
export function useSnapshots() {
  const { currentUser, userReady } = useAuth();
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSnapshots = useCallback(async () => {
    if (!userReady) return;
    try {
      setLoading(true);
      const data = await snapshotsAPI.getAll();
      setSnapshots(data);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [userReady]);

  const getSnapshot = async (date) => {
    try {
      return await snapshotsAPI.getByDate(date);
    } catch (err) {
      toast.error("Failed to load snapshot");
      return null;
    }
  };

  const saveSnapshot = async (data, customDate) => {
    try {
      await snapshotsAPI.save(data, customDate);
      await fetchSnapshots();
    } catch (err) {
      toast.error("Failed to save report");
      throw err;
    }
  };

  const deleteSnapshot = async (id) => {
    try {
      await snapshotsAPI.delete(id);
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error("Failed to delete history entry");
      throw err;
    }
  };

  useEffect(() => {
    if (currentUser && userReady) {
      fetchSnapshots();
    } else if (!currentUser) {
      setSnapshots([]);
      setLoading(false);
    }
  }, [fetchSnapshots, currentUser, userReady]);

  return {
    snapshots,
    loading,
    fetchSnapshots,
    getSnapshot,
    saveSnapshot,
    deleteSnapshot,
  };
}