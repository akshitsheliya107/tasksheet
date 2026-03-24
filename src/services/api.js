// ============ TASKS API (localStorage) ============
const TASKS_KEY = "tasks";
function getTasksFromLS() {
  return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
}
function setTasksToLS(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
export const tasksAPI = {
  async getAll() {
    return getTasksFromLS();
  },
  async create(task) {
    const tasks = getTasksFromLS();
    const id = Date.now();
    const newTask = { ...task, id };
    tasks.push(newTask);
    setTasksToLS(tasks);
    return newTask;
  },
  async update(id, task) {
    let tasks = getTasksFromLS();
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...task } : t));
    setTasksToLS(tasks);
    return tasks.find((t) => t.id === id);
  },
  async delete(id) {
    let tasks = getTasksFromLS();
    tasks = tasks.filter((t) => t.id !== id);
    setTasksToLS(tasks);
    return true;
  },
  async createMultiple(tasksArr) {
    let tasks = getTasksFromLS();
    const newTasks = tasksArr.map((task) => ({
      ...task,
      id: Date.now() + Math.random(),
    }));
    tasks = tasks.concat(newTasks);
    setTasksToLS(tasks);
    return newTasks;
  },
};

// ============ DISCUSSION API (localStorage) ============
const DISCUSSION_KEY = "discussion";
export const discussionAPI = {
  async get() {
    let discussion = JSON.parse(localStorage.getItem(DISCUSSION_KEY));
    if (!discussion) {
      discussion = {
        id: 1,
        hrs: 0,
        min: 0,
        note: "General discussion / meetings / calls",
      };
      localStorage.setItem(DISCUSSION_KEY, JSON.stringify(discussion));
    }
    return discussion;
  },
  async update(id, discussion) {
    const updated = { ...discussion, id };
    localStorage.setItem(DISCUSSION_KEY, JSON.stringify(updated));
    return updated;
  },
};

// ============ TESTING API (localStorage) ============
const TESTING_KEY = "testing";
const BUGS_KEY = "bugs";
export const testingAPI = {
  async get() {
    let testing = JSON.parse(localStorage.getItem(TESTING_KEY));
    if (!testing) {
      testing = {
        id: 1,
        testing_hrs: 0,
        testing_min: 0,
        testing_module: "",
        test_case_scenario: "",
        bug_founded_module: "",
      };
      localStorage.setItem(TESTING_KEY, JSON.stringify(testing));
    }
    const bugs = JSON.parse(localStorage.getItem(BUGS_KEY) || "[]").filter(
      (b) => b.testing_id === testing.id
    );
    return { ...testing, bugs };
  },
  async update(id, testing) {
    const updated = { ...testing, id };
    localStorage.setItem(TESTING_KEY, JSON.stringify(updated));
    return updated;
  },
};

// ============ BUGS API (localStorage) ============
export const bugsAPI = {
  async create(testingId, bug) {
    let bugs = JSON.parse(localStorage.getItem(BUGS_KEY) || "[]");
    const id = Date.now();
    const newBug = { ...bug, id, testing_id: testingId };
    bugs.push(newBug);
    localStorage.setItem(BUGS_KEY, JSON.stringify(bugs));
    return newBug;
  },
  async update(id, bug) {
    let bugs = JSON.parse(localStorage.getItem(BUGS_KEY) || "[]");
    bugs = bugs.map((b) => (b.id === id ? { ...b, ...bug } : b));
    localStorage.setItem(BUGS_KEY, JSON.stringify(bugs));
    return bugs.find((b) => b.id === id);
  },
  async delete(id) {
    let bugs = JSON.parse(localStorage.getItem(BUGS_KEY) || "[]");
    bugs = bugs.filter((b) => b.id !== id);
    localStorage.setItem(BUGS_KEY, JSON.stringify(bugs));
    return true;
  },
};

// ============ OPTIONS API (localStorage) ============
const TYPE_OPTIONS_KEY = "type_options";
const STATUS_OPTIONS_KEY = "status_options";
const BUG_TYPE_OPTIONS_KEY = "bug_type_options";
function getOptionsFromLS(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}
function setOptionsToLS(key, options) {
  localStorage.setItem(key, JSON.stringify(options));
}
export const optionsAPI = {
  async getTypeOptions() {
    return getOptionsFromLS(TYPE_OPTIONS_KEY);
  },
  async addTypeOption(name) {
    const options = getOptionsFromLS(TYPE_OPTIONS_KEY);
    const newOption = { id: Date.now(), name };
    options.push(newOption);
    setOptionsToLS(TYPE_OPTIONS_KEY, options);
    return newOption;
  },
  async updateTypeOption(id, name) {
    let options = getOptionsFromLS(TYPE_OPTIONS_KEY);
    options = options.map((o) => (o.id === id ? { ...o, name } : o));
    setOptionsToLS(TYPE_OPTIONS_KEY, options);
    return options.find((o) => o.id === id);
  },
  async deleteTypeOption(id) {
    let options = getOptionsFromLS(TYPE_OPTIONS_KEY);
    options = options.filter((o) => o.id !== id);
    setOptionsToLS(TYPE_OPTIONS_KEY, options);
    return true;
  },
  async getStatusOptions() {
    return getOptionsFromLS(STATUS_OPTIONS_KEY);
  },
  async addStatusOption(name) {
    const options = getOptionsFromLS(STATUS_OPTIONS_KEY);
    const newOption = { id: Date.now(), name };
    options.push(newOption);
    setOptionsToLS(STATUS_OPTIONS_KEY, options);
    return newOption;
  },
  async updateStatusOption(id, name) {
    let options = getOptionsFromLS(STATUS_OPTIONS_KEY);
    options = options.map((o) => (o.id === id ? { ...o, name } : o));
    setOptionsToLS(STATUS_OPTIONS_KEY, options);
    return options.find((o) => o.id === id);
  },
  async deleteStatusOption(id) {
    let options = getOptionsFromLS(STATUS_OPTIONS_KEY);
    options = options.filter((o) => o.id !== id);
    setOptionsToLS(STATUS_OPTIONS_KEY, options);
    return true;
  },
  async getBugTypeOptions() {
    return getOptionsFromLS(BUG_TYPE_OPTIONS_KEY);
  },
  async addBugTypeOption(name) {
    const options = getOptionsFromLS(BUG_TYPE_OPTIONS_KEY);
    const newOption = { id: Date.now(), name };
    options.push(newOption);
    setOptionsToLS(BUG_TYPE_OPTIONS_KEY, options);
    return newOption;
  },
  async updateBugTypeOption(id, name) {
    let options = getOptionsFromLS(BUG_TYPE_OPTIONS_KEY);
    options = options.map((o) => (o.id === id ? { ...o, name } : o));
    setOptionsToLS(BUG_TYPE_OPTIONS_KEY, options);
    return options.find((o) => o.id === id);
  },
  async deleteBugTypeOption(id) {
    let options = getOptionsFromLS(BUG_TYPE_OPTIONS_KEY);
    options = options.filter((o) => o.id !== id);
    setOptionsToLS(BUG_TYPE_OPTIONS_KEY, options);
    return true;
  },
};

// ============ SNAPSHOTS/HISTORY API (localStorage) ============
const SNAPSHOTS_KEY = "daily_snapshots";
export const snapshotsAPI = {
  async getAll() {
    return JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]");
  },
  async getByDate(date) {
    const snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]");
    return snapshots.find((s) => s.snapshot_date === date) || null;
  },
  async save(snapshotData) {
    const today = new Date().toISOString().split("T")[0];
    let snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]");
    let existing = snapshots.find((s) => s.snapshot_date === today);
    if (existing) {
      Object.assign(existing, {
        tasks_data: snapshotData.tasks,
        discussion_data: snapshotData.discussion,
        testing_data: snapshotData.testing,
        total_stats: snapshotData.stats,
        updated_at: new Date().toISOString(),
      });
    } else {
      existing = {
        id: Date.now(),
        snapshot_date: today,
        tasks_data: snapshotData.tasks,
        discussion_data: snapshotData.discussion,
        testing_data: snapshotData.testing,
        total_stats: snapshotData.stats,
        created_at: new Date().toISOString(),
      };
      snapshots.push(existing);
    }
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    return existing;
  },
  async delete(id) {
    let snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]");
    snapshots = snapshots.filter((s) => s.id !== id);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    return true;
  },
};
