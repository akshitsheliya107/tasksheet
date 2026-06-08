import { 
  initialTypeOptions, 
  initialStatusOptions, 
  initialBugTypeOptions 
} from "../data";
import { db } from "../lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc 
} from "firebase/firestore";

let currentUserId = "";

export const setUserId = (uid) => {
  currentUserId = uid;
  console.log("[API] setUserId called with:", uid);
};

// ─── Path Helpers ───────────────────────────────────────────
const getRef = (...pathSegments) => {
  if (!currentUserId) throw new Error("No currentUserId set!");
  return doc(db, "users", currentUserId, ...pathSegments);
};

const getLocalKey = (...pathSegments) => 
  `tasksheet_${currentUserId}_${pathSegments.join("_")}`;

// ─── Core Read ───────────────────────────────────────────────
async function getFirestoreData(pathSegments, defaultData) {
  if (!currentUserId) {
    console.warn("[API] getFirestoreData: No userId, returning default");
    return defaultData;
  }

  // 1. Firestore se try karo (with timeout)
  try {
    console.log(`[API] Fetching: users/${currentUserId}/${pathSegments.join("/")}`);
    
    const snap = await Promise.race([
      getDoc(getRef(...pathSegments)),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT")), 10000)
      )
    ]);

    if (snap.exists()) {
      const raw = snap.data();
      const result = Array.isArray(defaultData) 
        ? (raw.items ?? defaultData) 
        : raw;
      
      // Cache mein save karo
      try { 
        localStorage.setItem(
          getLocalKey(...pathSegments), 
          JSON.stringify(result)
        ); 
      } catch(e) {}
      
      console.log(`[API] ✅ Fetched from Firestore:`, pathSegments);
      return result;
    } else {
      console.log(`[API] Document not found, creating default:`, pathSegments);
      // Default data set karo (background mein)
      saveToFirestore(pathSegments, defaultData);
      return defaultData;
    }
  } catch (err) {
    console.warn(`[API] ⚠️ Firestore failed (${err.message}):`, pathSegments);
  }

  // 2. localStorage fallback
  try {
    const cached = localStorage.getItem(getLocalKey(...pathSegments));
    if (cached) {
      console.log(`[API] 📦 Using localStorage cache:`, pathSegments);
      return JSON.parse(cached);
    }
  } catch(e) {}

  // 3. Default return karo
  console.log(`[API] Using default data for:`, pathSegments);
  return defaultData;
}

// ─── Core Write ──────────────────────────────────────────────
function saveToFirestore(pathSegments, data, retryCount = 0) {
  // ✅ Agar userId nahi hai to wait karo
  if (!currentUserId) {
    if (retryCount < 5) {
      console.warn(`[API] No userId, retrying in 500ms... (${retryCount + 1}/5)`);
      setTimeout(() => saveToFirestore(pathSegments, data, retryCount + 1), 500);
      return;
    }
    console.error("[API] saveToFirestore FAILED: No userId after retries");
    return;
  }

  const payload = Array.isArray(data) ? { items: data } : data;

  // localStorage mein turant save
  try {
    localStorage.setItem(
      getLocalKey(...pathSegments), 
      JSON.stringify(data)
    );
  } catch(e) {}

  // Firestore mein background save with retry on permission error
  setDoc(getRef(...pathSegments), payload)
    .then(() => {
      console.log(`[API] ✅ Saved to Firestore:`, pathSegments);
    })
    .catch(err => {
      console.error(`[API] ❌ Firestore save failed:`, pathSegments, err.message);
      
      // ✅ Permission error pe retry karo
      if (err.code === 'permission-denied' && retryCount < 3) {
        console.warn(`[API] Permission denied, retrying in 1s... (${retryCount + 1}/3)`);
        setTimeout(() => saveToFirestore(pathSegments, data, retryCount + 1), 1000);
      }
    });
}

async function setFirestoreData(pathSegments, data) {
  saveToFirestore(pathSegments, data);
}

// ════════════════════════════════════════════════════════════
// TASKS API
// ════════════════════════════════════════════════════════════
export const tasksAPI = {
  async getAll() {
    return await getFirestoreData(["workspace", "tasks"], []);
  },

  async create(task) {
    const tasks = await this.getAll();
    const id = Date.now();
    const h = Number(task.hrs) || 0;
    const m = Number(task.min) || 0;
    const totalMinutes = h * 60 + m;

    const newTask = {
      id,
      date: task.date || "",
      task: task.task || "",
      hrs: h,
      min: m,
      total_min: totalMinutes,
      final_time: Number((totalMinutes / 60).toFixed(2)),
      cu_link: task.cu_link || task.cuLink || "",
      type: task.type || "",
      status: task.status || "",
      bug_type: task.bug_type || task.bugType || "",
      is_valid: task.is_valid !== undefined 
        ? task.is_valid 
        : task.isValid !== undefined 
          ? task.isValid 
          : null,
      valid_time: task.valid_time || task.validTime || 0,
      invalid_time: task.invalid_time || task.invalidTime || 0,
    };

    tasks.push(newTask);
    saveToFirestore(["workspace", "tasks"], tasks);
    return newTask;
  },

  async update(id, task) {
    let tasks = await this.getAll();
    tasks = tasks.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t,
        date: task.date !== undefined ? task.date : t.date,
        task: task.task !== undefined ? task.task : t.task,
        hrs: task.hrs !== undefined ? task.hrs : t.hrs,
        min: task.min !== undefined ? task.min : t.min,
        total_min: task.total_min ?? task.totalMin ?? t.total_min,
        final_time: task.final_time ?? task.finalTime ?? t.final_time,
        cu_link: task.cu_link ?? task.cuLink ?? t.cu_link,
        type: task.type !== undefined ? task.type : t.type,
        status: task.status !== undefined ? task.status : t.status,
        bug_type: task.bug_type ?? task.bugType ?? t.bug_type,
        is_valid: task.is_valid !== undefined 
          ? task.is_valid 
          : task.isValid !== undefined 
            ? task.isValid 
            : t.is_valid,
        valid_time: task.valid_time ?? task.validTime ?? t.valid_time,
        invalid_time: task.invalid_time ?? task.invalidTime ?? t.invalid_time,
      };
    });

    saveToFirestore(["workspace", "tasks"], tasks);
    return tasks.find((t) => t.id === id);
  },

  async delete(id) {
    let tasks = await this.getAll();
    tasks = tasks.filter((t) => t.id !== id);
    saveToFirestore(["workspace", "tasks"], tasks);
    return true;
  },

  async deleteAll() {
    const newTasks = Array(10).fill(null).map((_, i) => ({
      id: Date.now() + i,
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
    saveToFirestore(["workspace", "tasks"], newTasks);
    return newTasks;
  },

async createMultiple(tasksArr) {
  let tasks = await this.getAll();
  const now = Date.now();
  
  const newTasks = tasksArr.map((task, i) => ({
    // ✅ Agar id already hai to use karo, warna naya unique banao
    id: task.id || (now + (i * 10)),
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
  
  tasks = [...tasks, ...newTasks];
  saveToFirestore(["workspace", "tasks"], tasks);
  return newTasks;
},}

// ════════════════════════════════════════════════════════════
// DISCUSSION API
// ════════════════════════════════════════════════════════════
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
    saveToFirestore(["workspace", "discussion"], updated);
    return updated;
  },
};

// ════════════════════════════════════════════════════════════
// MR ISSUE API
// ════════════════════════════════════════════════════════════
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
    saveToFirestore(["workspace", "mrIssue"], updated);
    return updated;
  },
};

// ════════════════════════════════════════════════════════════
// TESTING API
// ════════════════════════════════════════════════════════════
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
    saveToFirestore(["workspace", "testing"], updated);
    return updated;
  },
};

// ════════════════════════════════════════════════════════════
// BUGS API
// ════════════════════════════════════════════════════════════
export const bugsAPI = {
  async create(testingId, bug) {
    let bugs = await getFirestoreData(["workspace", "bugs"], []);
    const id = Date.now();
    const newBug = { ...bug, id, testing_id: testingId };
    bugs.push(newBug);
    saveToFirestore(["workspace", "bugs"], bugs);
    return newBug;
  },

  async update(id, bug) {
    let bugs = await getFirestoreData(["workspace", "bugs"], []);
    bugs = bugs.map((b) => (b.id === id ? { ...b, ...bug } : b));
    saveToFirestore(["workspace", "bugs"], bugs);
    return bugs.find((b) => b.id === id);
  },

  async delete(id) {
    let bugs = await getFirestoreData(["workspace", "bugs"], []);
    bugs = bugs.filter((b) => b.id !== id);
    saveToFirestore(["workspace", "bugs"], bugs);
    return true;
  },
};

// ════════════════════════════════════════════════════════════
// OPTIONS API
// ════════════════════════════════════════════════════════════
export const optionsAPI = {
  // TYPE OPTIONS
  async getTypeOptions() {
    return await getFirestoreData(
      ["options", "types"],
      initialTypeOptions.map((name, i) => ({ id: Date.now() + i, name }))
    );
  },
  async addTypeOption(name) {
    const options = await this.getTypeOptions();
    const newOption = { id: Date.now(), name };
    options.push(newOption);
    saveToFirestore(["options", "types"], options);
    return newOption;
  },
  async updateTypeOption(id, name) {
    let options = await this.getTypeOptions();
    options = options.map((o) => (o.id === id ? { ...o, name } : o));
    saveToFirestore(["options", "types"], options);
    return options.find((o) => o.id === id);
  },
  async deleteTypeOption(id) {
    let options = await this.getTypeOptions();
    options = options.filter((o) => o.id !== id);
    saveToFirestore(["options", "types"], options);
    return true;
  },

  // STATUS OPTIONS
  async getStatusOptions() {
    return await getFirestoreData(
      ["options", "statuses"],
      initialStatusOptions.map((name, i) => ({ id: Date.now() + i, name }))
    );
  },
  async addStatusOption(name) {
    const options = await this.getStatusOptions();
    const newOption = { id: Date.now(), name };
    options.push(newOption);
    saveToFirestore(["options", "statuses"], options);
    return newOption;
  },
  async updateStatusOption(id, name) {
    let options = await this.getStatusOptions();
    options = options.map((o) => (o.id === id ? { ...o, name } : o));
    saveToFirestore(["options", "statuses"], options);
    return options.find((o) => o.id === id);
  },
  async deleteStatusOption(id) {
    let options = await this.getStatusOptions();
    options = options.filter((o) => o.id !== id);
    saveToFirestore(["options", "statuses"], options);
    return true;
  },

  // BUG TYPE OPTIONS
  async getBugTypeOptions() {
    return await getFirestoreData(
      ["options", "bugTypes"],
      initialBugTypeOptions.map((name, i) => ({ id: Date.now() + i, name }))
    );
  },
  async addBugTypeOption(name) {
    const options = await this.getBugTypeOptions();
    const newOption = { id: Date.now(), name };
    options.push(newOption);
    saveToFirestore(["options", "bugTypes"], options);
    return newOption;
  },
  async updateBugTypeOption(id, name) {
    let options = await this.getBugTypeOptions();
    options = options.map((o) => (o.id === id ? { ...o, name } : o));
    saveToFirestore(["options", "bugTypes"], options);
    return options.find((o) => o.id === id);
  },
  async deleteBugTypeOption(id) {
    let options = await this.getBugTypeOptions();
    options = options.filter((o) => o.id !== id);
    saveToFirestore(["options", "bugTypes"], options);
    return true;
  },
};

// ════════════════════════════════════════════════════════════
// SNAPSHOTS API
// ════════════════════════════════════════════════════════════
export const snapshotsAPI = {
  async getAll() {
    if (!currentUserId) return [];
    try {
      const col = collection(db, "users", currentUserId, "snapshots");
      const snap = await Promise.race([
        getDocs(col),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT")), 10000)
        )
      ]);
      const data = snap.docs.map(d => d.data());
      try { 
        localStorage.setItem(
          getLocalKey("snapshots_all"), 
          JSON.stringify(data)
        ); 
      } catch(e) {}
      return data;
    } catch (err) {
      console.warn("[SNAPSHOTS] getAll failed:", err.message);
      try {
        const cached = localStorage.getItem(getLocalKey("snapshots_all"));
        if (cached) return JSON.parse(cached);
      } catch(e) {}
      return [];
    }
  },

  async getByDate(date) {
    if (!currentUserId) return null;
    try {
      const snap = await Promise.race([
        getDoc(getRef("snapshots", date)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT")), 10000)
        )
      ]);
      if (snap.exists()) {
        const data = snap.data();
        try { 
          localStorage.setItem(
            getLocalKey("snapshots", date), 
            JSON.stringify(data)
          ); 
        } catch(e) {}
        return data;
      }
      return null;
    } catch (err) {
      console.warn("[SNAPSHOTS] getByDate failed:", err.message);
      try {
        const cached = localStorage.getItem(getLocalKey("snapshots", date));
        if (cached) return JSON.parse(cached);
      } catch(e) {}
      return null;
    }
  },

  async save(snapshotData, customDate) {
    if (!currentUserId) return;
    
    const targetDate = customDate || new Date().toISOString().split("T")[0];
    const existing = await this.getByDate(targetDate) || {
      id: Date.now(),
      snapshot_date: targetDate,
      created_at: new Date().toISOString(),
    };

    const toSave = {
      ...existing,
      tasks_data: snapshotData.tasks,
      discussion_data: snapshotData.discussion,
      mrIssue_data: snapshotData.mrIssue,
      testing_data: snapshotData.testing,
      total_stats: snapshotData.stats,
      updated_at: new Date().toISOString(),
    };

    try { 
      localStorage.setItem(
        getLocalKey("snapshots", targetDate), 
        JSON.stringify(toSave)
      ); 
    } catch(e) {}

    // Firestore mein save karo
    setDoc(getRef("snapshots", targetDate), toSave)
      .then(() => console.log("[SNAPSHOTS] ✅ Saved:", targetDate))
      .catch(err => console.error("[SNAPSHOTS] ❌ Save failed:", err.message));

    return toSave;
  },

  async delete(id) {
    if (!currentUserId) return false;
    const snapshots = await this.getAll();
    const target = snapshots.find(s => s.id === id);
    if (target) {
      try {
        const updated = snapshots.filter(s => s.id !== id);
        localStorage.setItem(
          getLocalKey("snapshots_all"), 
          JSON.stringify(updated)
        );
        localStorage.removeItem(
          getLocalKey("snapshots", target.snapshot_date)
        );
      } catch(e) {}
      await deleteDoc(getRef("snapshots", target.snapshot_date));
      return true;
    }
    return false;
  },
};

// ════════════════════════════════════════════════════════════
// WORKSPACE API
// ════════════════════════════════════════════════════════════
export const workspaceAPI = {
  async loadWorkspace(date) {
    if (!currentUserId) return false;

    const snap = await snapshotsAPI.getByDate(date);

    if (snap) {
      console.log(`[WORKSPACE] Loading snapshot for ${date}`);
      saveToFirestore(["workspace", "tasks"], snap.tasks_data || []);
      saveToFirestore(["workspace", "discussion"], snap.discussion_data || {
        id: 1, hrs: 0, min: 0, note: "General discussion / meetings / calls"
      });
      saveToFirestore(["workspace", "mrIssue"], snap.mrIssue_data || {
        id: 1, hrs: 0, min: 0, note: "MR Issues / review / fixing"
      });

      const testData = snap.testing_data || {};
      const bugs = testData.bugs || [];
      const testWithoutBugs = { ...testData };
      delete testWithoutBugs.bugs;

      saveToFirestore(["workspace", "testing"], testWithoutBugs);
      saveToFirestore(["workspace", "bugs"], bugs);
    } else {
      console.log(`[WORKSPACE] No snapshot for ${date}, fresh workspace`);
      saveToFirestore(["workspace", "tasks"], []);
      saveToFirestore(["workspace", "discussion"], {
        id: 1, hrs: 0, min: 0, note: "General discussion / meetings / calls"
      });
      saveToFirestore(["workspace", "mrIssue"], {
        id: 1, hrs: 0, min: 0, note: "MR Issues / review / fixing"
      });
      saveToFirestore(["workspace", "testing"], {
        id: 1, testing_hrs: 0, testing_min: 0,
        testing_module: "", test_case_scenario: "", bug_founded_module: ""
      });
      saveToFirestore(["workspace", "bugs"], []);
    }

    return true;
  }
};