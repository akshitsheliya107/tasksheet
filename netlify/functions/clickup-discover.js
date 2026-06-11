import { clickupFetch, jsonResponse, parseBody, handleOptions } from "./_helpers.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = parseBody(event);
  } catch (e) {
    return jsonResponse(400, { success: false, error: "Invalid JSON body" });
  }

  const { token, teamId, userId } = body;

  if (!token || !teamId) {
    return jsonResponse(400, { 
      success: false, 
      error: "Token and Team ID required" 
    });
  }

  console.log("[Discover] Starting workspace scan...");
  console.log("[Discover] teamId:", teamId, "userId:", userId || "(not provided)");

  try {
    // STRATEGY 1: Get user's own spaces (if any) - SAFELY
    let ownLists = [];
    try {
      ownLists = await getOwnLists(token, teamId);
      console.log(`[Discover] Found ${ownLists.length} own lists`);
    } catch (e) {
      console.error("[Discover] getOwnLists failed:", e.message);
      ownLists = [];
    }

    // STRATEGY 2: Get lists from time entries - SAFELY
    let sharedLists = [];
    try {
      sharedLists = await getSharedListsFromTimeEntries(token, teamId, userId);
      console.log(`[Discover] Found ${sharedLists.length} shared lists from time entries`);
    } catch (e) {
      console.error("[Discover] getSharedListsFromTimeEntries failed:", e.message);
      sharedLists = [];
    }

    // Merge: unique lists by ID
    const listsMap = new Map();
    [...ownLists, ...sharedLists].forEach(l => {
      if (l && l.id && !listsMap.has(l.id)) {
        listsMap.set(l.id, l);
      }
    });
    
    const allLists = Array.from(listsMap.values());
    console.log(`[Discover] Total unique lists: ${allLists.length}`);

    if (allLists.length === 0) {
      return jsonResponse(200, {
        success: true,
        summary: {
          totalSpaces: 0,
          totalLists: 0,
          totalCustomFields: 0,
          totalTaskTypes: 0,
        },
        lists: [],
        customFields: [],
        taskTypes: [],
        suggestedRules: [],
        warning: "No lists found. Make sure: (1) You have time entries logged in the last 90 days in ClickUp, OR (2) You own some spaces in this team. Try tracking time on a task first then re-scan.",
      });
    }

    // Step 3: Sample tasks per list - OPTIMIZED (use task IDs we already discovered)
    const sampledData = [];
    const allCustomFields = new Map();
    const allTaskTypes = new Map();

    const BATCH_SIZE = 3;
    
    for (let i = 0; i < allLists.length; i += BATCH_SIZE) {
      const batch = allLists.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.allSettled(batch.map(async (list) => {
        try {
          // OPTIMIZATION: If we have sampleTaskIds from time entries, fetch those directly
          // Otherwise fall back to /list/{id}/task endpoint
          let tasks = [];
          
          if (list.sampleTaskIds && list.sampleTaskIds.length > 0) {
            // Fetch sample tasks we already discovered
            const taskResults = await Promise.allSettled(
              list.sampleTaskIds.slice(0, 2).map(taskId => 
                clickupFetch(`/task/${taskId}`, token)
              )
            );
            
            tasks = taskResults
              .filter(r => r.status === 'fulfilled' && r.value)
              .map(r => r.value);
          } else {
            // Fallback: fetch from list (might fail with access error - that's OK)
            try {
              const tasksRes = await clickupFetch(
                `/list/${list.id}/task?archived=false&page=0&order_by=updated&reverse=true&include_closed=true&subtasks=false`,
                token
              );
              tasks = (tasksRes.tasks || []).slice(0, 2);
            } catch (e) {
              console.log(`[Discover] Cannot access list ${list.name} directly, skipping`);
              return {
                listId: list.id,
                listName: list.name,
                folder: list.folder || null,
                space: list.space || "Shared",
                taskCount: 0,
                sampleTasks: [],
                note: "No accessible sample tasks",
              };
            }
          }
          
          const sampleTasks = tasks.map(t => {
            let taskTypeName = "Task";
            if (t.custom_item_id !== null && t.custom_item_id !== undefined) {
              taskTypeName = `Type ID: ${t.custom_item_id}`;
            }
            allTaskTypes.set(taskTypeName, (allTaskTypes.get(taskTypeName) || 0) + 1);

            const fields = (t.custom_fields || []).map(cf => {
              const key = `${cf.name}__${cf.type}`;
              if (!allCustomFields.has(key)) {
                allCustomFields.set(key, {
                  name: cf.name,
                  type: cf.type,
                  lists: new Set(),
                  sampleValues: [],
                  options: cf.type_config?.options?.map(o => o.name || o.label) || [],
                });
              }
              const tracked = allCustomFields.get(key);
              tracked.lists.add(list.name);
              
              if (cf.value !== null && cf.value !== undefined) {
                let displayValue = cf.value;
                if (cf.type_config?.options) {
                  const opt = cf.type_config.options.find(o => 
                    o.id === cf.value || String(o.orderindex) === String(cf.value)
                  );
                  if (opt) displayValue = opt.name || opt.label;
                }
                if (tracked.sampleValues.length < 3 && !tracked.sampleValues.includes(displayValue)) {
                  tracked.sampleValues.push(String(displayValue).slice(0, 50));
                }
              }

              return {
                name: cf.name,
                type: cf.type,
                value: cf.value,
              };
            });

            return {
              id: t.id,
              name: (t.name || "").slice(0, 100),
              url: t.url,
              mainStatus: t.status?.status,
              taskType: taskTypeName,
              customFields: fields,
            };
          });

          return {
            listId: list.id,
            listName: list.name,
            folder: list.folder || null,
            space: list.space || "Shared",
            taskCount: list.taskCount || tasks.length,
            sampleTasks,
          };
        } catch (e) {
          console.error(`[Discover] Error processing list ${list.id} (${list.name}):`, e.message);
          return {
            listId: list.id,
            listName: list.name,
            folder: list.folder || null,
            space: list.space || "Shared",
            taskCount: list.taskCount || 0,
            sampleTasks: [],
            error: e.message,
          };
        }
      }));

      batchResults.forEach(result => {
        if (result.status === "fulfilled" && result.value) {
          sampledData.push(result.value);
        }
      });
    }

    const customFieldsArray = Array.from(allCustomFields.values()).map(cf => ({
      name: cf.name,
      type: cf.type,
      usedInLists: Array.from(cf.lists),
      sampleValues: cf.sampleValues,
      hasOptions: cf.options.length > 0,
      optionCount: cf.options.length,
      options: cf.options.slice(0, 10),
    }));

    const taskTypesArray = Array.from(allTaskTypes.entries()).map(([name, count]) => ({
      name, count
    }));

    const suggestedRules = generateSuggestedRules(sampledData, customFieldsArray);

    console.log(`[Discover] ✅ Complete: ${allLists.length} lists, ${customFieldsArray.length} fields, ${suggestedRules.length} suggestions`);

    return jsonResponse(200, {
      success: true,
      summary: {
        totalSpaces: ownLists.length > 0 ? 1 : 0,
        totalLists: allLists.length,
        totalCustomFields: customFieldsArray.length,
        totalTaskTypes: taskTypesArray.length,
        ownLists: ownLists.length,
        sharedLists: sharedLists.length,
      },
      lists: sampledData,
      customFields: customFieldsArray,
      taskTypes: taskTypesArray,
      suggestedRules,
    });

  } catch (error) {
    console.error("[Discover] FATAL Error:", error);
    console.error("[Discover] Stack:", error.stack);
    return jsonResponse(500, {
      success: false,
      error: error.message || "Failed to scan workspace",
      stack: error.stack?.slice(0, 500),
    });
  }
};

async function getOwnLists(token, teamId) {
  const allLists = [];
  
  const spacesRes = await clickupFetch(`/team/${teamId}/space?archived=false`, token).catch(e => {
    console.error("getOwnLists spaces error:", e.message);
    return null;
  });
  
  if (!spacesRes) return allLists;
  
  const spaces = spacesRes.spaces || [];
  
  for (const space of spaces) {
    const foldersRes = await clickupFetch(`/space/${space.id}/folder?archived=false`, token).catch(() => null);
    if (foldersRes) {
      const folders = foldersRes.folders || [];
      for (const folder of folders) {
        for (const list of (folder.lists || [])) {
          allLists.push({
            id: list.id,
            name: list.name,
            folder: folder.name,
            space: space.name,
            taskCount: list.task_count || 0,
          });
        }
      }
    }

    const listsRes = await clickupFetch(`/space/${space.id}/list?archived=false`, token).catch(() => null);
    if (listsRes) {
      const folderlessLists = listsRes.lists || [];
      for (const list of folderlessLists) {
        allLists.push({
          id: list.id,
          name: list.name,
          folder: null,
          space: space.name,
          taskCount: list.task_count || 0,
        });
      }
    }
  }
  
  return allLists;
}

async function getSharedListsFromTimeEntries(token, teamId, userId) {
  const endMs = Date.now();
  const startMs = endMs - (90 * 24 * 60 * 60 * 1000);
  
  let url = `/team/${teamId}/time_entries?start_date=${startMs}&end_date=${endMs}`;
  if (userId) {
    url += `&assignee=${userId}`;
  }
  
  const timeRes = await clickupFetch(url, token).catch(e => {
    console.error("Time entries fetch error:", e.message);
    return null;
  });
  
  if (!timeRes) return [];
  
  const timeEntries = timeRes.data || [];
  console.log(`[Discover] Found ${timeEntries.length} time entries`);

  // Get unique task IDs - but ONLY first 50 (sufficient to find all unique lists)
  const taskIds = new Set();
  timeEntries.forEach(te => {
    if (te.task && te.task.id && taskIds.size < 50) {
      taskIds.add(te.task.id);
    }
  });
  console.log(`[Discover] Sampling ${taskIds.size} tasks to discover lists (limited from ${timeEntries.length})`);

  if (taskIds.size === 0) return [];

  const uniqueListIds = new Set();
  const listMap = new Map();

  const taskIdsArray = Array.from(taskIds);
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < taskIdsArray.length; i += BATCH_SIZE) {
    const batch = taskIdsArray.slice(i, i + BATCH_SIZE);
    
    await Promise.allSettled(batch.map(async (taskId) => {
      try {
        const taskRes = await clickupFetch(`/task/${taskId}`, token);
        if (taskRes && taskRes.list && taskRes.list.id) {
          const listId = taskRes.list.id;
          if (!uniqueListIds.has(listId)) {
            uniqueListIds.add(listId);
            listMap.set(listId, {
              id: listId,
              name: taskRes.list.name || "Unknown List",
              folder: taskRes.folder?.name || null,
              space: taskRes.space?.name || taskRes.space?.id || "Shared",
              taskCount: 0,
              // Save a sample task ID so we can fetch fields later WITHOUT calling /list/{id}/task
              sampleTaskIds: [taskId],
            });
          } else {
            // Track more sample tasks for this list
            const existing = listMap.get(listId);
            if (existing.sampleTaskIds.length < 3) {
              existing.sampleTaskIds.push(taskId);
            }
          }
        }
      } catch (e) {
        // Skip failed tasks silently
      }
    }));
  }

  console.log(`[Discover] Discovered ${listMap.size} unique lists`);
  return Array.from(listMap.values());
}

function generateSuggestedRules(listsData, customFields) {
  const rules = [];
  
  const bugTypeField = customFields.find(f => 
    f.name?.toLowerCase().replace(/[^\w\s]/g, '').trim().includes('bug type')
  );
  
  const panelField = customFields.find(f => 
    f.name?.toLowerCase().replace(/[^\w\s]/g, '').trim() === 'panel'
  );
  
  const seenPatterns = new Set();
  
  listsData.forEach(list => {
    const nameLower = (list.listName || "").toLowerCase();
    
    if (nameLower.startsWith('sprint') && !seenPatterns.has('^sprint')) {
      seenPatterns.add('^sprint');
      rules.push({
        id: `suggested_sprint`,
        pattern: "^sprint",
        matchType: "regex",
        type: "NF",
        statusSource: panelField ? "panel_field" : "main_status",
        bugTypeSource: "none",
        enabled: true,
        reason: `List "${list.listName}" matches Sprint pattern → NF`,
      });
    } else if (nameLower.includes('panel') && nameLower.includes('bug') && !seenPatterns.has('panel')) {
      seenPatterns.add('panel');
      rules.push({
        id: `suggested_panel`,
        pattern: "panel",
        matchType: "contains",
        type: "Panel Bugs",
        statusSource: "panel_field",
        bugTypeSource: bugTypeField ? "custom_field" : "none",
        enabled: true,
        reason: `List "${list.listName}" → Panel Bugs`,
      });
    } else if (nameLower.includes('alpha') && !seenPatterns.has('alpha')) {
      seenPatterns.add('alpha');
      rules.push({
        id: `suggested_alpha`,
        pattern: "alpha",
        matchType: "contains",
        type: "Alpha Bugs",
        statusSource: "panel_field",
        bugTypeSource: bugTypeField ? "custom_field" : "none",
        enabled: true,
        reason: `List "${list.listName}" → Alpha Bugs`,
      });
    }
  });
  
  return rules;
}
