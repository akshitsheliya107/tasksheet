import { initialTypeOptions, initialStatusOptions, initialBugTypeOptions } from "../data";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, getDocFromCache } from "firebase/firestore";

let currentUserId = "";

export const setUserId = (uid) => {
  currentUserId = uid;
};

// Helper to get document reference
const getRef = (...pathSegments) => doc(db, "users", currentUserId, ...pathSegments);
const getLocalKey = (...pathSegments) => `tasksheet_${currentUserId}_${pathSegments.join("_")}`;

// Helper to get data from a document, with default fallback
async function getFirestoreData(pathSegments, defaultData) {
  if (!currentUserId) {
    console.warn("[API] getFirestoreData skipped: No currentUserId", pathSegments);
    return defaultData;
  }
  try {
    console.log(`[API] getFirestoreData: Fetching from path [${pathSegments.join(", ")}]...`);
    
    // Add a 1s timeout to network fetch. If adblocker blocks it, we don't wait 10s.
    const ref = getRef(...pathSegments);
    const snap = await Promise.race([
      getDoc(ref),
      new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 1000))
    ]);

    if (snap.exists()) {
      const data = snap.data();
      const finalData = Array.isArray(defaultData) ? data.items || defaultData : data;
      try { localStorage.setItem(getLocalKey(...pathSegments), JSON.stringify(finalData)); } catch(e){}
      return finalData;
    }
  } catch (err) {
    console.warn(`[API ERROR] getFirestoreData network/timeout for path [${pathSegments.join(", ")}]:`, err.message);
    
    // Try local cache if network fails or times out
    try {
      const cacheSnap = await getDocFromCache(getRef(...pathSegments));
      if (cacheSnap.exists()) {
        const data = cacheSnap.data();
        console.log(`[API] getFirestoreData: Success (from cache) for path [${pathSegments.join(", ")}]`);
        return Array.isArray(defaultData) ? data.items || defaultData : data;
      }
    } catch (cacheErr) {
       // Cache empty or failed
    }
    
    // Try localStorage fallback
    try {
      const localStr = localStorage.getItem(getLocalKey(...pathSegments));
      if (localStr) {
        console.log(`[API] getFirestoreData: Success (from localStorage) for path [${pathSegments.join(", ")}]`);
        return JSON.parse(localStr);
      }
    } catch(e) {}
  }
  
  // Set defaults without waiting
  setFirestoreData(pathSegments, defaultData);
  return defaultData;
}

async function setFirestoreData(pathSegments, data) {
  if (!currentUserId) {
    console.warn("[API] setFirestoreData skipped: No currentUserId", pathSegments);
    return;
  }
  const payload = Array.isArray(data) ? { items: data } : data;
  
  if (currentUserId) {
    try {
      // For localStorage, store the final resolved data structure so reading is easier
      localStorage.setItem(getLocalKey(...pathSegments), JSON.stringify(Array.isArray(data) ? data : payload));
    } catch (e) {}
  }

  try {
    console.log(`[API] setFirestoreData: Saving to path [${pathSegments.join(", ")}]...`, payload);
    // DO NOT AWAIT. This prevents UI freezing when offline or adblocked. Firestore queues it locally.
    setDoc(getRef(...pathSegments), payload).catch(err => {
      console.error(`[API ERROR] setFirestoreData failed in background for path [${pathSegments.join(", ")}]:`, err);
    });
    console.log(`[API] setFirestoreData: Success (queued) for path [${pathSegments.join(", ")}]`);
  } catch (err) {
    console.error(`[API ERROR] setFirestoreData failed for path [${pathSegments.join(", ")}]:`, err);
  }
}

// ============ TASKS API ============
export const tasksAPI = {
  async getAll() {
    console.log("[TASKS API] getAll() called");
    return await getFirestoreData(["workspace", "tasks"], []);
  },

  async create(task) {
    console.log("[TASKS API] create() called with:", task);
    const tasks = await this.getAll();
    const id = Date.now();

    const h = Number(task.hrs) || 0;
    const m = Number(task.min) || 0;
    const totalMinutes = h * 60 + m;
    const finalTime = Number((totalMinutes / 60).toFixed(2));

    const newTask = {
      id,
      date: task.date || "",
      task: task.task || "",
      hrs: h,
      min: m,
      total_min: totalMinutes,
      final_time: finalTime,
      cu_link: task.cu_link || task.cuLink || "",
      type: task.type || "",
      status: task.status || "",
      bug_type: task.bug_type || task.bugType || "",
      is_valid: task.is_valid !== undefined ? task.is_valid : task.isValid !== undefined ? task.isValid : null,
      valid_time: task.valid_time || task.validTime || 0,
      invalid_time: task.invalid_time || task.invalidTime || 0,
    };

    tasks.push(newTask);
    await setFirestoreData(["workspace", "tasks"], tasks);
    console.log("[TASKS API] create() successful, new task id:", id);
    return newTask;
  },

  async update(id, task) {
    console.log(`[TASKS API] update() called for id ${id} with:`, task);
    let tasks = await this.getAll();

    tasks = tasks.map((t) => {
      if (t.id !== id) return t;

      return {
        ...t,
        date: task.date !== undefined ? task.date : t.date,
        task: task.task !== undefined ? task.task : t.task,
        hrs: task.hrs !== undefined ? task.hrs : t.hrs,
        min: task.min !== undefined ? task.min : t.min,
        total_min: task.totalMin !== undefined ? task.totalMin : task.total_min !== undefined ? task.total_min : t.total_min,
        final_time: task.finalTime !== undefined ? task.finalTime : task.final_time !== undefined ? task.final_time : t.final_time,
        cu_link: task.cuLink !== undefined ? task.cuLink : task.cu_link !== undefined ? task.cu_link : t.cu_link,
        type: task.type !== undefined ? task.type : t.type,
        status: task.status !== undefined ? task.status : t.status,
        bug_type: task.bugType !== undefined ? task.bugType : task.bug_type !== undefined ? task.bug_type : t.bug_type,
        is_valid: task.isValid !== undefined ? task.isValid : task.is_valid !== undefined ? task.is_valid : t.is_valid,
        valid_time: task.validTime !== undefined ? task.validTime : task.valid_time !== undefined ? task.valid_time : t.valid_time,
        invalid_time: task.invalidTime !== undefined ? task.invalidTime : task.invalid_time !== undefined ? task.invalid_time : t.invalid_time,
      };
    });

    await setFirestoreData(["workspace", "tasks"], tasks);
    console.log(`[TASKS API] update() successful for id ${id}`);
    return tasks.find((t) => t.id === id);
  },

  async delete(id) {
    console.log(`[TASKS API] delete() called for id ${id}`);
    let tasks = await this.getAll();
    tasks = tasks.filter((t) => t.id !== id);
    await setFirestoreData(["workspace", "tasks"], tasks);
    console.log(`[TASKS API] delete() successful for id: ${id}`);
    return true;
  },

  async deleteAll() {
    const newTasks = Array(10).fill(null).map((_, index) => ({
      id: Date.now() + index,
      date: new Date().toLocaleDateString(),
      task: "",
      hrs: 0,
      min: 0,
      total_min: 0,
      final_time: 0,
      cu_link: "",
      type: "",
      status: "",
      bug_type: "",
      is_valid: null,
      valid_time: 0,
      invalid_time: 0,
    }));
    
    // DO NOT AWAIT, background write
    setFirestoreData(["workspace", "tasks"], newTasks).catch(err => {
      console.error("[API ERROR] setFirestoreData failed in background for path [workspace, tasks]:", err);
    });
    
    console.log(`[TASKS API] deleteAll() successful, reset to 10 blank tasks`);
    return newTasks;
  },

  async createMultiple(tasksArr) {
    console.log(`[TASKS API] createMultiple() called to add ${tasksArr.length} tasks`);
    let tasks = await this.getAll();
    const newTasks = tasksArr.map((task, index) => ({
      id: Date.now() + index,
      date: task.date || "",
      task: task.task || "",
      hrs: task.hrs || 0,
      min: task.min || 0,
      total_min: 0,
      final_time: 0,
      cu_link: "",
      type: "",
      status: "",
      bug_type: "",
      is_valid: null,
      valid_time: 0,
      invalid_time: 0,
    }));
    tasks = tasks.concat(newTasks);
    await setFirestoreData(["workspace", "tasks"], tasks);
    console.log(`[TASKS API] createMultiple() successful`);
    return newTasks;
  },
};

// ============ DISCUSSION API ============
export const discussionAPI = {
  async get() {
    return await getFirestoreData(["workspace", "discussion"], {
      id: 1,
      hrs: 0,
      min: 0,
      note: "General discussion / meetings / calls",
    });
  },

  async update(id, discussion) {
    const updated = { ...discussion, id };
    setFirestoreData(["workspace", "discussion"], updated);
    return updated;
  },
};

// ============ MR ISSUE API ============
export const mrIssueAPI = {
  async get() {
    return await getFirestoreData(["workspace", "mrIssue"], {
      id: 1,
      hrs: 0,
      min: 0,
      note: "MR Issues / review / fixing",
    });
  },

  async update(id, mrIssue) {
    const updated = { ...mrIssue, id };
    setFirestoreData(["workspace", "mrIssue"], updated);
    return updated;
  },
};

// ============ TESTING API ============
export const testingAPI = {
  async get() {
    const testing = await getFirestoreData(["workspace", "testing"], {
      id: 1,
      testing_hrs: 0,
      testing_min: 0,
      testing_module: "",
      test_case_scenario: "",
      bug_founded_module: "",
    });
    
    const bugs = await getFirestoreData(["workspace", "bugs"], []);
    const filteredBugs = bugs.filter((b) => b.testing_id === testing.id);
    return { ...testing, bugs: filteredBugs };
  },

  async update(id, testing) {
    const current = await getFirestoreData(["workspace", "testing"], {});
    const updated = {
      ...current,
      id,
      testing_hrs: testing.testingTime?.hrs ?? testing.testing_hrs ?? 0,
      testing_min: testing.testingTime?.min ?? testing.testing_min ?? 0,
      testing_module: testing.testingModule ?? testing.testing_module ?? "",
      test_case_scenario: testing.testCaseScenario ?? testing.test_case_scenario ?? "",
      bug_founded_module: testing.bugFoundedModule ?? testing.bug_founded_module ?? "",
    };
    setFirestoreData(["workspace", "testing"], updated);
    return updated;
  },
};

// ============ BUGS API ============
export const bugsAPI = {
  async create(testingId, bug) {
    let bugs = await getFirestoreData(["workspace", "bugs"], []);
    const id = Date.now();
    const newBug = { ...bug, id, testing_id: testingId };
    bugs.push(newBug);
    setFirestoreData(["workspace", "bugs"], bugs);
    return newBug;
  },

  async update(id, bug) {
    let bugs = await getFirestoreData(["workspace", "bugs"], []);
    bugs = bugs.map((b) => (b.id === id ? { ...b, ...bug } : b));
    setFirestoreData(["workspace", "bugs"], bugs);
    return bugs.find((b) => b.id === id);
  },

  async delete(id) {
    let bugs = await getFirestoreData(["workspace", "bugs"], []);
    bugs = bugs.filter((b) => b.id !== id);
    setFirestoreData(["workspace", "bugs"], bugs);
    return true;
  },
};

// ============ OPTIONS API ============
export const optionsAPI = {
  async getTypeOptions() { return await getFirestoreData(["options", "types"], initialTypeOptions.map((name, i) => ({ id: Date.now() + i, name }))); },
  async addTypeOption(name) {
    const options = await this.getTypeOptions();
    const newOption = { id: Date.now(), name };
    options.push(newOption);
    setFirestoreData(["options", "types"], options);
    return newOption;
  },
  async updateTypeOption(id, name) {
    let options = await this.getTypeOptions();
    options = options.map((o) => (o.id === id ? { ...o, name } : o));
    setFirestoreData(["options", "types"], options);
    return options.find((o) => o.id === id);
  },
  async deleteTypeOption(id) {
    let options = await this.getTypeOptions();
    options = options.filter((o) => o.id !== id);
    setFirestoreData(["options", "types"], options);
    return true;
  },

  async getStatusOptions() { return await getFirestoreData(["options", "statuses"], initialStatusOptions.map((name, i) => ({ id: Date.now() + i, name }))); },
  async addStatusOption(name) {
    const options = await this.getStatusOptions();
    const newOption = { id: Date.now(), name };
    options.push(newOption);
    setFirestoreData(["options", "statuses"], options);
    return newOption;
  },
  async updateStatusOption(id, name) {
    let options = await this.getStatusOptions();
    options = options.map((o) => (o.id === id ? { ...o, name } : o));
    setFirestoreData(["options", "statuses"], options);
    return options.find((o) => o.id === id);
  },
  async deleteStatusOption(id) {
    let options = await this.getStatusOptions();
    options = options.filter((o) => o.id !== id);
    setFirestoreData(["options", "statuses"], options);
    return true;
  },

  async getBugTypeOptions() { return await getFirestoreData(["options", "bugTypes"], initialBugTypeOptions.map((name, i) => ({ id: Date.now() + i, name }))); },
  async addBugTypeOption(name) {
    const options = await this.getBugTypeOptions();
    const newOption = { id: Date.now(), name };
    options.push(newOption);
    setFirestoreData(["options", "bugTypes"], options);
    return newOption;
  },
  async updateBugTypeOption(id, name) {
    let options = await this.getBugTypeOptions();
    options = options.map((o) => (o.id === id ? { ...o, name } : o));
    setFirestoreData(["options", "bugTypes"], options);
    return options.find((o) => o.id === id);
  },
  async deleteBugTypeOption(id) {
    let options = await this.getBugTypeOptions();
    options = options.filter((o) => o.id !== id);
    setFirestoreData(["options", "bugTypes"], options);
    return true;
  },
};

// ============ SNAPSHOTS/HISTORY API ============
export const snapshotsAPI = {
  async getAll() {
    console.log("[SNAPSHOTS API] getAll() called");
    if (!currentUserId) return [];
    try {
      const snapshotsCol = collection(db, "users", currentUserId, "snapshots");
      const snapshotDocs = await Promise.race([
        getDocs(snapshotsCol),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 1000))
      ]);
      const snaps = snapshotDocs.docs.map(doc => doc.data());
      try { localStorage.setItem(getLocalKey("snapshots_all"), JSON.stringify(snaps)); } catch(e){}
      return snaps;
    } catch (err) {
      console.warn("[SNAPSHOTS API ERROR] getAll() network/timeout:", err.message);
      try {
        const localSnaps = localStorage.getItem(getLocalKey("snapshots_all"));
        if (localSnaps) return JSON.parse(localSnaps);
      } catch(e) {}
      return [];
    }
  },

  async getByDate(date) {
    console.log(`[SNAPSHOTS API] getByDate() called for date ${date}`);
    if (!currentUserId) return null;
    try {
      const snapDoc = await Promise.race([
        getDoc(getRef("snapshots", date)),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 1000))
      ]);
      if (snapDoc.exists()) {
        const data = snapDoc.data();
        try { localStorage.setItem(getLocalKey("snapshots", date), JSON.stringify(data)); } catch(e){}
        return data;
      }
      return null;
    } catch (err) {
      console.warn(`[SNAPSHOTS API ERROR] getByDate() network/timeout for date ${date}:`, err.message);
      try {
        const cacheSnap = await getDocFromCache(getRef("snapshots", date));
        if (cacheSnap.exists()) return cacheSnap.data();
      } catch (cacheErr) {
      }
      try {
        const localSnap = localStorage.getItem(getLocalKey("snapshots", date));
        if (localSnap) return JSON.parse(localSnap);
      } catch(e) {}
      return null;
    }
  },

  async save(snapshotData, customDate) {
    console.log("[SNAPSHOTS API] save() called for date:", customDate);
    if (!currentUserId) {
      console.warn("[SNAPSHOTS API] save() aborted: no currentUserId");
      return;
    }
    const targetDate = customDate || new Date().toISOString().split("T")[0];
    
    try {
      const existing = await this.getByDate(targetDate) || {
        id: Date.now(),
        snapshot_date: targetDate,
        created_at: new Date().toISOString(),
      };

      Object.assign(existing, {
        tasks_data: snapshotData.tasks,
        discussion_data: snapshotData.discussion,
        mrIssue_data: snapshotData.mrIssue,
        testing_data: snapshotData.testing,
        total_stats: snapshotData.stats,
        updated_at: new Date().toISOString(),
      });

      try { localStorage.setItem(getLocalKey("snapshots", targetDate), JSON.stringify(existing)); } catch(e){}

      console.log(`[SNAPSHOTS API] Saving snapshot to firestore for date ${targetDate}...`);
      // DO NOT AWAIT. This prevents UI freezing when offline or adblocked.
      setDoc(getRef("snapshots", targetDate), existing).catch(err => {
        console.error(`[SNAPSHOTS API ERROR] save() failed in background for date ${targetDate}:`, err);
      });
      console.log(`[SNAPSHOTS API] save() successful (queued) for date ${targetDate}`);
      return existing;
    } catch (err) {
      console.error(`[SNAPSHOTS API ERROR] save() failed for date ${targetDate}:`, err);
      throw err;
    }
  },

  async delete(id) {
    if (!currentUserId) return false;
    // Find snapshot by id (since doc name is date, we need to find it)
    const snapshots = await this.getAll();
    const target = snapshots.find(s => s.id === id);
    if (target) {
      try {
         const newSnaps = snapshots.filter(s => s.id !== id);
         localStorage.setItem(getLocalKey("snapshots_all"), JSON.stringify(newSnaps));
         localStorage.removeItem(getLocalKey("snapshots", target.snapshot_date));
      } catch(e){}

      await deleteDoc(getRef("snapshots", target.snapshot_date));
      return true;
    }
    return false;
  },
};

// ============ WORKSPACE API ============
export const workspaceAPI = {
  async loadWorkspace(date) {
    console.log(`[WORKSPACE API] loadWorkspace() called for date ${date}`);
    if (!currentUserId) {
      console.warn("[WORKSPACE API] loadWorkspace aborted: no currentUserId");
      return false;
    }
    
    try {
      const snap = await snapshotsAPI.getByDate(date);
      
      if (snap) {
        console.log(`[WORKSPACE API] Snapshot found for date ${date}. Restoring data...`);
        await setFirestoreData(["workspace", "tasks"], snap.tasks_data || []);
        await setFirestoreData(["workspace", "discussion"], snap.discussion_data || {});
        await setFirestoreData(["workspace", "mrIssue"], snap.mrIssue_data || {});
        
        const testData = snap.testing_data || {};
        const bugs = testData.bugs || [];
        const testWithoutBugs = { ...testData };
        delete testWithoutBugs.bugs;

        await setFirestoreData(["workspace", "testing"], testWithoutBugs);
        await setFirestoreData(["workspace", "bugs"], bugs);
        console.log(`[WORKSPACE API] Workspace restored from snapshot successfully.`);
      } else {
        console.log(`[WORKSPACE API] No snapshot for date ${date}. Initializing fresh workspace...`);
        await setFirestoreData(["workspace", "tasks"], []);
        await setFirestoreData(["workspace", "discussion"], {
          id: 1, hrs: 0, min: 0, note: "General discussion / meetings / calls"
        });
        await setFirestoreData(["workspace", "mrIssue"], {
          id: 1, hrs: 0, min: 0, note: "MR Issues / review / fixing"
        });
        await setFirestoreData(["workspace", "testing"], {
          id: 1, testing_hrs: 0, testing_min: 0, testing_module: "", test_case_scenario: "", bug_founded_module: ""
        });
        await setFirestoreData(["workspace", "bugs"], []);
        console.log(`[WORKSPACE API] Fresh workspace initialized successfully.`);
      }
      return true;
    } catch (err) {
      console.error(`[WORKSPACE API ERROR] loadWorkspace failed for date ${date}:`, err);
      throw err;
    }
  }
};