import { clickupFetch, jsonResponse, parseBody, handleOptions } from "./_helpers.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  const { token, taskIds } = parseBody(event);
  if (!token || !taskIds || !Array.isArray(taskIds)) {
    return jsonResponse(400, { success: false, error: "Missing token or taskIds" });
  }

  try {
    const promises = taskIds.map(taskId => {
      if (!taskId) return Promise.resolve(null);
      return clickupFetch(`/task/${taskId}`, token).catch(() => null);
    });

    const tasks = await Promise.all(promises);
    const results = taskIds.map((id, index) => {
      const t = tasks[index];
      if (!t) return { id, name: "Not Found or Invalid", status: "N/A" };
      return { id, name: t.name, status: t.status?.status || "N/A", url: t.url };
    });

    return jsonResponse(200, { success: true, results });
  } catch (error) {
    return jsonResponse(error.status || 500, { success: false, error: error.message });
  }
};
