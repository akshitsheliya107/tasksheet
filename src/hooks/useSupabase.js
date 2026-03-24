import { useState, useEffect, useCallback } from "react";
import {
  tasksAPI,
  discussionAPI,
  testingAPI,
  bugsAPI,
  optionsAPI,
  snapshotsAPI,
} from "../services/api";
import toast from "react-hot-toast";

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const transformTask = (task) => ({
    id: task.id,
    date: task.date,
    task: task.task,
    hrs: task.hrs,
    min: task.min,
    totalMin: task.total_min,
    finalTime: task.final_time,
    type: task.type,
    status: task.status,
    bugType: task.bug_type,
    isValid: task.is_valid,
    validTime: task.valid_time,
    invalidTime: task.invalid_time,
  });

  const fetchTasks = useCallback(async () => {
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
  }, []);

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

  const createDefaultTasks = async (count = 4) => {
    try {
      const defaultTasks = Array(count)
        .fill(null)
        .map((_, i) => ({
          date: i === 0 ? new Date().toLocaleDateString() : "",
          task: "",
          hrs: 0,
          min: 0,
        }));
      const data = await tasksAPI.createMultiple(defaultTasks);
      setTasks(data.map(transformTask));
    } catch (err) {
      toast.error("Failed to create default tasks");
      throw err;
    }
  };

  const updateTask = async (id, task) => {
    try {
      await tasksAPI.update(id, task);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...task } : t))
      );
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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    createDefaultTasks,
    updateTask,
    deleteTask,
    setTasks,
  };
}

export function useDiscussion() {
  const [discussion, setDiscussion] = useState({
    id: null,
    hrs: 0,
    min: 0,
    note: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchDiscussion = useCallback(async () => {
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
  }, []);

  const updateDiscussion = async (field, value) => {
    const updated = { ...discussion, [field]: value };
    setDiscussion(updated);

    try {
      await discussionAPI.update(discussion.id, updated);
    } catch (err) {
      toast.error("Failed to update discussion");
    }
  };

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  return { discussion, loading, updateDiscussion, setDiscussion };
}

export function useTesting() {
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
  }, []);

  const updateTesting = async (updates) => {
    const updated = { ...testing, ...updates };
    setTesting(updated);

    try {
      await testingAPI.update(testing.id, updated);
    } catch (err) {
      toast.error("Failed to update testing");
    }
  };

  const addBug = async () => {
    try {
      const newBug = await bugsAPI.create(testing.id, {
        description: "",
        url: "",
      });
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
    fetchTesting();
  }, [fetchTesting]);

  return {
    testing,
    loading,
    updateTesting,
    addBug,
    updateBug,
    deleteBug,
    setTesting,
  };
}

export function useOptions() {
  const [typeOptions, setTypeOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [bugTypeOptions, setBugTypeOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      const [types, statuses, bugTypes] = await Promise.all([
        optionsAPI.getTypeOptions(),
        optionsAPI.getStatusOptions(),
        optionsAPI.getBugTypeOptions(),
      ]);
      setTypeOptions(types);
      setStatusOptions(statuses);
      setBugTypeOptions(bugTypes);
    } catch (err) {
      toast.error("Failed to load options");
    } finally {
      setLoading(false);
    }
  }, []);

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
      setTypeOptions((prev) =>
        prev.map((opt) => (opt.id === id ? { ...opt, name } : opt))
      );
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
      setStatusOptions((prev) =>
        prev.map((opt) => (opt.id === id ? { ...opt, name } : opt))
      );
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
      setBugTypeOptions((prev) =>
        prev.map((opt) => (opt.id === id ? { ...opt, name } : opt))
      );
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

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    typeOptions,
    statusOptions,
    bugTypeOptions,
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
  };
}

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await snapshotsAPI.getAll();
      setSnapshots(data);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  const getSnapshot = async (date) => {
    try {
      return await snapshotsAPI.getByDate(date);
    } catch (err) {
      toast.error("Failed to load snapshot");
      return null;
    }
  };

  const saveSnapshot = async (data) => {
    try {
      await snapshotsAPI.save(data);
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
    fetchSnapshots();
  }, [fetchSnapshots]);

  return {
    snapshots,
    loading,
    fetchSnapshots,
    getSnapshot,
    saveSnapshot,
    deleteSnapshot,
  };
}
