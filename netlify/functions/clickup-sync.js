// import { clickupFetch, jsonResponse, parseBody, handleOptions } from "./_helpers.js";

// export const handler = async (event) => {
//   if (event.httpMethod === "OPTIONS") return handleOptions();
//   if (event.httpMethod !== "POST") {
//     return jsonResponse(405, { error: "Method not allowed" });
//   }

//   const { 
//     token, 
//     teamId, 
//     userId, 
//     date,                      // YYYY-MM-DD format
//     listMapping = [],
//     panelCustomFieldName = "Panel",
//     bugTypeCustomFieldName = "Bug Type",
//     defaultType = "Internal Bug",
//   } = parseBody(event);

//   // Validation
//   if (!token || !teamId || !userId) {
//     return jsonResponse(400, { 
//       success: false, 
//       error: "Missing required fields: token, teamId, userId" 
//     });
//   }

//   try {
//     // Step 1: Calculate date range (start of day to end of day) in milliseconds
//     const targetDate = date ? new Date(date + "T00:00:00") : new Date();
//     targetDate.setHours(0, 0, 0, 0);
//     const startMs = targetDate.getTime();
    
//     const endDate = new Date(targetDate);
//     endDate.setHours(23, 59, 59, 999);
//     const endMs = endDate.getTime();

//     console.log(`[Sync] Fetching time entries from ${new Date(startMs).toISOString()} to ${new Date(endMs).toISOString()}`);

//     // Step 2: Fetch time entries for the date
//     const timeEntriesUrl = `/team/${teamId}/time_entries?start_date=${startMs}&end_date=${endMs}&assignee=${userId}`;
//     const timeResponse = await clickupFetch(timeEntriesUrl, token);
//     const timeEntries = timeResponse.data || [];

//     console.log(`[Sync] Found ${timeEntries.length} time entries`);

//     if (timeEntries.length === 0) {
//       return jsonResponse(200, {
//         success: true,
//         tasks: [],
//         message: "No time entries found for this date",
//         date: date,
//         rawTimeEntries: 0,
//       });
//     }

//     // Step 3: Get unique task IDs
//     const uniqueTaskIds = [...new Set(
//       timeEntries
//         .map(entry => entry.task?.id)
//         .filter(Boolean)
//     )];

//     console.log(`[Sync] Unique tasks: ${uniqueTaskIds.length}`);

//     // Step 4: Fetch full details for each task (in parallel)
//     const taskDetailsPromises = uniqueTaskIds.map(taskId =>
//       clickupFetch(`/task/${taskId}?include_subtasks=false&custom_fields=true`, token)
//         .catch(err => {
//           console.error(`[Sync] Failed to fetch task ${taskId}:`, err.message);
//           return null;
//         })
//     );
    
//     const taskDetails = await Promise.all(taskDetailsPromises);
//     const taskMap = {};
//     taskDetails.filter(Boolean).forEach(t => {
//       taskMap[t.id] = t;
//     });

//     // Step 5: Group time entries by task and sum durations
//     const grouped = {};
//     timeEntries.forEach(entry => {
//       const taskId = entry.task?.id;
//       if (!taskId) return;

//       if (!grouped[taskId]) {
//         grouped[taskId] = {
//           taskId,
//           totalDurationMs: 0,
//           entries: [],
//         };
//       }
      
//       const duration = Number(entry.duration || 0);
//       grouped[taskId].totalDurationMs += duration;
//       grouped[taskId].entries.push(entry);
//     });

//     // Step 6: Build final task list with mapping applied
//  // Step 6: Build final task list with mapping applied
// const finalTasks = Object.values(grouped).map(group => {
//   const task = taskMap[group.taskId];
//   if (!task) return null;

//   const listName = task.list?.name || "";

//   // 🔍 DEBUG: Log all custom fields for first task
//   console.log(`\n[DEBUG] Task: ${task.name}`);
//   console.log(`[DEBUG] List: ${listName}`);
//   console.log(`[DEBUG] Custom fields count: ${task.custom_fields?.length || 0}`);
//   if (task.custom_fields && task.custom_fields.length > 0) {
//     task.custom_fields.forEach((cf, i) => {
//       console.log(`[DEBUG]   Field ${i}: name="${cf.name}" | type="${cf.type}" | value=${JSON.stringify(cf.value)}`);
//     });
//   }
      
//       // Apply mapping rules
//       const mapping = findMatchingRule(listName, listMapping) || {
//         type: defaultType,
//         statusSource: "main_status",
//         bugTypeSource: "custom_field",
//       };

//       // Get status based on source
//       let status = "";
//       if (mapping.statusSource === "panel_field") {
//         status = getCustomFieldValue(task, panelCustomFieldName) || "";
//       } else {
//         status = task.status?.status || "";
//       }

//       // Get bug type based on source
//       let bugType = "";
//       if (mapping.bugTypeSource === "custom_field") {
//         bugType = getCustomFieldValue(task, bugTypeCustomFieldName) || "";
//       }
//       // if "none" -> bugType stays empty

//       // Format time
//       const totalMin = Math.round(group.totalDurationMs / 1000 / 60);
//       const hrs = Math.floor(totalMin / 60);
//       const min = totalMin % 60;

//       // Format date as DD/MM/YYYY for display
//       const displayDate = formatDateDisplay(targetDate);

//       return {
//         // ClickUp identifiers
//         clickupTaskId: task.id,
//         clickupListName: listName,
//         clickupFolderName: task.folder?.name || "",
        
//         // Display fields
//         date: displayDate,
//         task: task.name || "",
//         cu_link: task.url || "",
//         hrs: hrs,
//         min: min,
//         total_min: totalMin,
//         final_time: Number((totalMin / 60).toFixed(2)),
        
//         // Mapped fields
//         type: mapping.type,
//         status: status,
//         bug_type: bugType,
        
//         // Defaults
//         is_valid: null,
//         valid_time: 0,
//         invalid_time: 0,
        
//         // Metadata
//         source: "clickup",
//         synced_at: new Date().toISOString(),
//         manually_edited: false,
        
//         // Debug info (optional)
//       _debug: {
//   mainStatus: task.status?.status,
//   panelField: getCustomFieldValue(task, panelCustomFieldName),
//   bugTypeField: getCustomFieldValue(task, bugTypeCustomFieldName),
//   mappingRule: mapping.id || "default",
//   // 🔍 Extra debug - all custom field names
//   allCustomFields: (task.custom_fields || []).map(cf => ({
//     name: cf.name,
//     type: cf.type,
//     value: cf.value,
//     hasOptions: !!cf.type_config?.options,
//   })),
// }
//       };
//     }).filter(Boolean);

//     return jsonResponse(200, {
//       success: true,
//       tasks: finalTasks,
//       count: finalTasks.length,
//       date: date,
//       rawTimeEntries: timeEntries.length,
//       uniqueTasks: uniqueTaskIds.length,
//     });

//   } catch (error) {
//     console.error("[Sync] Error:", error);
//     return jsonResponse(error.status || 500, {
//       success: false,
//       error: error.message || "Failed to sync from ClickUp",
//       details: error.clickupError || null,
//     });
//   }
// };

// /**
//  * Find matching mapping rule based on list name.
//  * Rules are checked in order, first match wins.
//  * Only enabled rules are considered.
//  */
// function findMatchingRule(listName, rules) {
//   if (!listName || !Array.isArray(rules)) return null;
  
//   const enabledRules = rules.filter(r => r.enabled);
  
//   for (const rule of enabledRules) {
//     if (!rule.pattern) continue;
    
//     const matches = matchPattern(listName, rule.pattern, rule.matchType);
//     if (matches) return rule;
//   }
  
//   return null;
// }

// /**
//  * Match list name against pattern using the specified match type.
//  */
// function matchPattern(listName, pattern, matchType) {
//   if (!listName || !pattern) return false;
  
//   const name = listName.trim();
//   const pat = pattern.trim();
//   const nameLower = name.toLowerCase();
//   const patLower = pat.toLowerCase();
  
//   switch (matchType) {
//     case "regex":
//       try {
//         const regex = new RegExp(pat, "i");
//         return regex.test(name);
//       } catch (e) {
//         return false;
//       }
//     case "exact":
//       return nameLower === patLower;
//     case "startsWith":
//       return nameLower.startsWith(patLower);
//     case "contains":
//     default:
//       return nameLower.includes(patLower);
//   }
// }

// /**
//  * Extract custom field value from ClickUp task.
//  * Handles dropdown, text, and label-type fields.
//  */
// function getCustomFieldValue(task, fieldName) {
//   if (!task?.custom_fields || !fieldName) return "";
  
//   const searchName = fieldName.toLowerCase().trim();
  
//   // Try exact match first (most accurate)
//   let field = task.custom_fields.find(
//     f => f.name?.toLowerCase().trim() === searchName
//   );
  
//   // If no exact match, try partial match (handles emoji prefixes, extra chars)
//   if (!field) {
//     field = task.custom_fields.find(f => {
//       const fieldNameLower = f.name?.toLowerCase().trim() || "";
//       // Remove emojis and special chars for comparison
//       const cleanFieldName = fieldNameLower.replace(/[^\w\s]/g, '').trim();
//       const cleanSearchName = searchName.replace(/[^\w\s]/g, '').trim();
//       return cleanFieldName === cleanSearchName || cleanFieldName.includes(cleanSearchName);
//     });
//   }
//   if (!field) return "";
  
//   const value = field.value;
//   if (value === null || value === undefined || value === "") return "";
  
//   // Handle dropdown / labels (value is option ID or orderindex)
//   if (field.type_config?.options && Array.isArray(field.type_config.options)) {
//     const options = field.type_config.options;
    
//     // Try matching by ID first
//     let option = options.find(opt => opt.id === value);
    
//     // Then try by orderindex
//     if (!option) {
//       option = options.find(opt => 
//         String(opt.orderindex) === String(value) ||
//         opt.orderindex === Number(value)
//       );
//     }
    
//     // For labels type (multi-select), value might be array of IDs
//     if (!option && Array.isArray(value) && value.length > 0) {
//       const firstId = value[0];
//       option = options.find(opt => opt.id === firstId);
//     }
    
//     if (option) {
//       return option.name || option.label || "";
//     }
//   }
  
//   // Plain text/number value
//   if (typeof value === "string" || typeof value === "number") {
//     return String(value);
//   }
  
//   return "";
// }

// /**
//  * Format date as DD/MM/YYYY for display.
//  */
// function formatDateDisplay(date) {
//   const d = new Date(date);
//   return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
// }



import { clickupFetch, jsonResponse, parseBody, handleOptions } from "./_helpers.js";

// ClickUp task type (custom_item_id) mapping — same as Tampermonkey
const CLICKUP_CUSTOM_ITEM_TYPE_MAP = {
  1001: "Alpha Bugs",        // Alpha Bug
  1002: "Panel Bugs",        // ✅ Beta (Panel) Bug → Panel Bugs
  1003: "Panel Bugs",        // ✅ Beta (Apps) Bug → Panel Bugs
  1004: "Live Bugs",         // Live Bug
  1005: "Other",             // Release Notes
  1006: "NF",                // Feature
  1007: "Internal Bug",      // PDT Ongoing Task
  1008: "Internal Bug",      // Epic
  1009: "NF",                // New Feature
  1010: "Other",             // Meeting
  1011: "Other",             // Holiday
  1012: "Other",             // Leave
  1013: "Panel Bugs",        // ✅ UAT Bug → Panel Bugs
  1014: "Internal Bug",      // Dev Bug
};

// Fallback: list name based mapping
const LIST_TYPE_FALLBACK = {
  "triage": "Panel Bugs",         // ✅ Changed
  "master list": "Live Bugs",
  "q1": "Live Bugs",
  "q2": "Live Bugs",
  "q3": "Live Bugs",
  "q4": "Live Bugs",
  "live": "Live Bugs",
  "internal": "Internal Bug",
  "internal testing": "Internal Bug",
  "alpha": "Alpha Bugs",
  "alpha bugs": "Alpha Bugs",
  "setting": "Internal Bug",
  "nf": "NF",
  "revision": "NF",
};

// ─────────────────────────────────────────────
// SMART TYPE DETECTION (3-level priority)
// ─────────────────────────────────────────────

/**
 * Determine task type using 3-level priority (same as Tampermonkey):
 * 1. custom_item_id (most reliable)
 * 2. Custom field "Type"
 * 3. List name fallback
 */
function getSmartTaskType(task, listMapping, defaultType) {
  // ── PRIORITY 1: custom_item_id ──
  const customItemId = task.custom_item_id;
  const isDefault =
    customItemId === null ||
    customItemId === undefined ||
    customItemId === 0 ||
    customItemId === "0";

  if (!isDefault && CLICKUP_CUSTOM_ITEM_TYPE_MAP[Number(customItemId)]) {
    const mappedType = CLICKUP_CUSTOM_ITEM_TYPE_MAP[Number(customItemId)];
    console.log(`[TYPE] custom_item_id=${customItemId} → "${mappedType}"`);
    return {
      type: mappedType,
      source: `custom_item_id_${customItemId}`,
    };
  }

  // Default task (id=0/null) → go to next priority
  if (isDefault) {
    console.log(`[TYPE] Default task (custom_item_id=${customItemId}) → checking custom fields...`);
  }

  // ── PRIORITY 2: Custom field "Type" ──
  if (task.custom_fields) {
    for (const field of task.custom_fields) {
      const name = normalizeFieldNameForType(field.name);
      if (name !== "type") continue;

      const resolved = resolveFieldValue(field);
      if (resolved) {
        const mapped = mapTypeFieldToTaskType(resolved);
        if (mapped) {
          console.log(`[TYPE] Custom field Type="${resolved}" → "${mapped}"`);
          return { type: mapped, source: `custom_field_type_${resolved}` };
        }
      }
    }
  }

  // ── PRIORITY 3: List name mapping (user rules first, then fallback) ──
  const listName = task.list?.name || "";
  const isSharedWithMe = listName.toLowerCase() === "shared with me";

  if (listName && !isSharedWithMe) {
    // User-defined rules
    const rule = findMatchingRule(listName, listMapping);
    if (rule) {
      console.log(`[TYPE] List "${listName}" matched user rule → "${rule.type}"`);
      return { type: rule.type, source: `rule_${rule.id}` };
    }

    // Built-in fallback list mapping
    const lower = listName.toLowerCase();
    for (const [key, val] of Object.entries(LIST_TYPE_FALLBACK)) {
      if (lower.includes(key)) {
        console.log(`[TYPE] List "${listName}" fallback match "${key}" → "${val}"`);
        return { type: val, source: `list_fallback_${key}` };
      }
    }
  }

  // ── PRIORITY 4: Task name based detection ──
  const taskNameLower = (task.name || "").toLowerCase();
  if (taskNameLower.startsWith("epic:") || taskNameLower.startsWith("epic -")) {
    console.log(`[TYPE] Task name starts with EPIC → "Internal Bug"`);
    return { type: "Internal Bug", source: "task_name_epic" };
  }

  // ── FINAL FALLBACK ──
  console.log(`[TYPE] No match found → default "${defaultType}"`);
  return { type: defaultType, source: "default" };
}

// Helper: Strip emojis from field name
function normalizeFieldNameForType(name) {
  return String(name || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[^\w\s-]/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Helper: Resolve dropdown/label field value to display name
function resolveFieldValue(field) {
  const val = field.value;
  if (val === undefined || val === null || val === "") return "";

  const options = field.type_config?.options || [];
  if (options.length > 0) {
    const opt = options.find(
      (o) =>
        o.orderindex == val ||
        o.id == val ||
        String(o.id) === String(val) ||
        String(o.orderindex) === String(val)
    );
    if (opt) return opt.name || opt.label || "";
  }

  if (typeof val === "string") return val.trim();
  return String(val);
}

// Helper: Map "Type" custom field value → our task type
function mapTypeFieldToTaskType(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (!s) return "";
  if (s === "task") return "Internal Bug";
  if (/\blive\b/.test(s)) return "Live Bugs";
  if (/\b(beta|uat)\b/.test(s)) return "Panel Bugs";   // ✅ Changed
  if (/\b(alpha)\b/.test(s)) return "Alpha Bugs";
  if (/\bnf\b|feature|revision/.test(s)) return "NF";
  if (/\binternal\b|dev bug/.test(s)) return "Internal Bug";
  return "";
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const {
    token,
    teamId,
    userId,
    date,                             // YYYY-MM-DD format
    listMapping = [],
    panelCustomFieldName = "Panel",
    bugTypeCustomFieldName = "Bug Type",
    defaultType = "Internal Bug",
  } = parseBody(event);

  // Validation
  if (!token || !teamId || !userId) {
    return jsonResponse(400, {
      success: false,
      error: "Missing required fields: token, teamId, userId",
    });
  }

  try {
    // Step 1: Calculate date range in milliseconds
    const targetDate = date ? new Date(date + "T00:00:00") : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const startMs = targetDate.getTime();

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    const endMs = endDate.getTime();

    console.log(
      `[Sync] Fetching time entries from ${new Date(startMs).toISOString()} to ${new Date(endMs).toISOString()}`
    );

    // Step 2: Fetch time entries for the date
    const timeEntriesUrl = `/team/${teamId}/time_entries?start_date=${startMs}&end_date=${endMs}&assignee=${userId}`;
    const timeResponse = await clickupFetch(timeEntriesUrl, token);
    const timeEntries = timeResponse.data || [];

    console.log(`[Sync] Found ${timeEntries.length} time entries`);

    if (timeEntries.length === 0) {
      return jsonResponse(200, {
        success: true,
        tasks: [],
        message: "No time entries found for this date",
        date: date,
        rawTimeEntries: 0,
      });
    }

    // Step 3: Get unique task IDs
    const uniqueTaskIds = [
      ...new Set(
        timeEntries
          .map((entry) => entry.task?.id)
          .filter(Boolean)
      ),
    ];

    console.log(`[Sync] Unique tasks: ${uniqueTaskIds.length}`);

    // Step 4: Fetch full details for each task (in parallel)
    const taskDetailsPromises = uniqueTaskIds.map((taskId) =>
      clickupFetch(
        `/task/${taskId}?include_subtasks=false&custom_fields=true`,
        token
      ).catch((err) => {
        console.error(`[Sync] Failed to fetch task ${taskId}:`, err.message);
        return null;
      })
    );

    const taskDetails = await Promise.all(taskDetailsPromises);
    const taskMap = {};
    taskDetails.filter(Boolean).forEach((t) => {
      taskMap[t.id] = t;
    });

    // Step 5: Group time entries by task and sum durations
    const grouped = {};
    timeEntries.forEach((entry) => {
      const taskId = entry.task?.id;
      if (!taskId) return;

      if (!grouped[taskId]) {
        grouped[taskId] = {
          taskId,
          totalDurationMs: 0,
          entries: [],
        };
      }

      const duration = Number(entry.duration || 0);
      grouped[taskId].totalDurationMs += duration;
      grouped[taskId].entries.push(entry);
    });

    // Step 6: Build final task list with smart mapping applied
    const finalTasks = Object.values(grouped)
      .map((group) => {
        const task = taskMap[group.taskId];
        if (!task) return null;

        // ── Raw values from API ──
        const rawListName = task.list?.name || "";
        const isSharedWithMe = rawListName.toLowerCase() === "shared with me";

        // ── Smart Type Detection (3-level priority) ──
        const smartType = getSmartTaskType(task, listMapping, defaultType);

        console.log(
          `\n[TASK] "${task.name?.slice(0, 50)}"`
        );
        console.log(
          `  custom_item_id: ${task.custom_item_id} | list: "${rawListName}" | type: "${smartType.type}" | source: ${smartType.source}`
        );

        // ── Get mapping config for status/bugType source ──
        // User rules still control statusSource & bugTypeSource
        const userRule =
          !isSharedWithMe
            ? findMatchingRule(rawListName, listMapping)
            : null;

        const statusSource = userRule?.statusSource || "main_status";
        const bugTypeSource = userRule?.bugTypeSource || "custom_field";

        // ── Status ──
        let status = "";
        if (statusSource === "panel_field") {
          status = getCustomFieldValue(task, panelCustomFieldName) || "";
        } else {
          status = task.status?.status || "";
        }

        // ── Bug Type ──
        let bugType = "";
        if (bugTypeSource === "custom_field") {
          bugType = getCustomFieldValue(task, bugTypeCustomFieldName) || "";
        }

        // ── Format time ──
        const totalMin = Math.round(group.totalDurationMs / 1000 / 60);
        const hrs = Math.floor(totalMin / 60);
        const min = totalMin % 60;

        // ── Format date for display ──
        const displayDate = formatDateDisplay(targetDate);

        return {
          // ClickUp identifiers
          clickupTaskId: task.id,
          clickupListName: rawListName,
          clickupFolderName: task.folder?.name || "",   // ✅ FIXED: real folder name

          // Display fields
          date: displayDate,
          task: task.name || "",
          cu_link: task.url || "",
          hrs: hrs,
          min: min,
          total_min: totalMin,
          final_time: Number((totalMin / 60).toFixed(2)),

          // Mapped fields
          type: smartType.type,      // ✅ Smart detected type
          status: status,
          bug_type: bugType,

          // Defaults
          is_valid: null,
          valid_time: 0,
          invalid_time: 0,

          // Metadata
          source: "clickup",
          synced_at: new Date().toISOString(),
          manually_edited: false,

          // Debug info
          _debug: {
            mainStatus: task.status?.status,
            panelField: getCustomFieldValue(task, panelCustomFieldName),
            bugTypeField: getCustomFieldValue(task, bugTypeCustomFieldName),
            mappingRule: smartType.source,           // ✅ Shows exact source
            customItemId: task.custom_item_id,       // ✅ Raw custom_item_id
            rawListName: rawListName,                // ✅ Original list name
            isSharedWithMe: isSharedWithMe,          // ✅ Was it shared?
            allCustomFields: (task.custom_fields || []).map((cf) => ({
              name: cf.name,
              type: cf.type,
              value: cf.value,
              hasOptions: !!cf.type_config?.options,
            })),
          },
        };
      })
      .filter(Boolean);

    return jsonResponse(200, {
      success: true,
      tasks: finalTasks,
      count: finalTasks.length,
      date: date,
      rawTimeEntries: timeEntries.length,
      uniqueTasks: uniqueTaskIds.length,
    });
  } catch (error) {
    console.error("[Sync] Error:", error);
    return jsonResponse(error.status || 500, {
      success: false,
      error: error.message || "Failed to sync from ClickUp",
      details: error.clickupError || null,
    });
  }
};

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Find matching mapping rule based on list name.
 * Rules are checked in order, first match wins.
 * Only enabled rules are considered.
 */
function findMatchingRule(listName, rules) {
  if (!listName || !Array.isArray(rules)) return null;

  const enabledRules = rules.filter((r) => r.enabled);

  for (const rule of enabledRules) {
    if (!rule.pattern) continue;
    const matches = matchPattern(listName, rule.pattern, rule.matchType);
    if (matches) return rule;
  }

  return null;
}

/**
 * Match list name against pattern using the specified match type.
 */
function matchPattern(listName, pattern, matchType) {
  if (!listName || !pattern) return false;

  const name = listName.trim();
  const pat = pattern.trim();
  const nameLower = name.toLowerCase();
  const patLower = pat.toLowerCase();

  switch (matchType) {
    case "regex":
      try {
        const regex = new RegExp(pat, "i");
        return regex.test(name);
      } catch (e) {
        return false;
      }
    case "exact":
      return nameLower === patLower;
    case "startsWith":
      return nameLower.startsWith(patLower);
    case "contains":
    default:
      return nameLower.includes(patLower);
  }
}

/**
 * Extract custom field value from ClickUp task.
 * Handles dropdown, text, and label-type fields.
 */
// function getCustomFieldValue(task, fieldName) {
//   if (!task?.custom_fields || !fieldName) return "";

//   const searchName = fieldName.toLowerCase().trim();

//   // Try exact match first
//   let field = task.custom_fields.find(
//     (f) => f.name?.toLowerCase().trim() === searchName
//   );

//   // If no exact match, try partial match (handles emoji prefixes)
//   if (!field) {
//     field = task.custom_fields.find((f) => {
//       const fieldNameLower = f.name?.toLowerCase().trim() || "";
//       const cleanFieldName = fieldNameLower.replace(/[^\w\s]/g, "").trim();
//       const cleanSearchName = searchName.replace(/[^\w\s]/g, "").trim();
//       return (
//         cleanFieldName === cleanSearchName ||
//         cleanFieldName.includes(cleanSearchName)
//       );
//     });
//   }

//   if (!field) return "";

//   const value = field.value;
//   if (value === null || value === undefined || value === "") return "";

//   // Handle dropdown / labels
//   if (
//     field.type_config?.options &&
//     Array.isArray(field.type_config.options)
//   ) {
//     const options = field.type_config.options;

//     // Try by ID
//     let option = options.find((opt) => opt.id === value);

//     // Try by orderindex
//     if (!option) {
//       option = options.find(
//         (opt) =>
//           String(opt.orderindex) === String(value) ||
//           opt.orderindex === Number(value)
//       );
//     }

//     // For labels (multi-select), value might be array of IDs
//     if (!option && Array.isArray(value) && value.length > 0) {
//       const firstId = value[0];
//       option = options.find((opt) => opt.id === firstId);
//     }

//     if (option) {
//       return option.name || option.label || "";
//     }
//   }

//   // Plain text/number
//   if (typeof value === "string" || typeof value === "number") {
//     return String(value);
//   }

//   return "";
// }

/**
 * Extract custom field value from ClickUp task.
 * Handles dropdown, text, and label-type fields.
 * 
 * SMART matching: prefers EXACT match, then primary name match,
 * skips "Classification", "Validation", "Action" variations.
 */
function getCustomFieldValue(task, fieldName) {
  if (!task?.custom_fields || !fieldName) return "";

  const searchName = fieldName.toLowerCase().trim();

  // Helper: strip emojis and special chars for comparison
  const cleanName = (n) =>
    String(n || "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
      .replace(/[^\w\s]/g, " ")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

  const cleanSearch = cleanName(searchName);

  // ── PRIORITY 1: Exact match (after cleaning) ──
  let field = task.custom_fields.find(
    (f) => cleanName(f.name) === cleanSearch
  );

  // ── PRIORITY 2: Primary match (ends with searchName, no Classification/Validation/Action) ──
  if (!field) {
    field = task.custom_fields.find((f) => {
      const clean = cleanName(f.name);
      
      // Skip variants we DON'T want
      if (clean.includes("classification")) return false;
      if (clean.includes("validation")) return false;
      if (clean.includes("action")) return false;
      
      // Must end with our search term OR be exactly it
      return clean === cleanSearch || clean.endsWith(` ${cleanSearch}`);
    });
  }

  // ── PRIORITY 3: Partial match (last resort, but still skip bad variants) ──
  if (!field) {
    field = task.custom_fields.find((f) => {
      const clean = cleanName(f.name);
      
      if (clean.includes("classification")) return false;
      if (clean.includes("validation")) return false;
      if (clean.includes("action")) return false;
      
      return clean.includes(cleanSearch);
    });
  }

  if (!field) return "";

  const value = field.value;
  if (value === null || value === undefined || value === "") return "";

  // Handle dropdown / labels
  if (
    field.type_config?.options &&
    Array.isArray(field.type_config.options)
  ) {
    const options = field.type_config.options;

    // Try by ID
    let option = options.find((opt) => opt.id === value);

    // Try by orderindex
    if (!option) {
      option = options.find(
        (opt) =>
          String(opt.orderindex) === String(value) ||
          opt.orderindex === Number(value)
      );
    }

    // For labels (multi-select), value might be array of IDs
    if (!option && Array.isArray(value) && value.length > 0) {
      const firstId = value[0];
      option = options.find((opt) => opt.id === firstId);
    }

    if (option) {
      return option.name || option.label || "";
    }
  }

  // Plain text/number
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
}

/**
 * Format date as DD/MM/YYYY for display.
 */
function formatDateDisplay(date) {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}