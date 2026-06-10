import { clickupFetch, jsonResponse, parseBody, handleOptions } from "./_helpers.js";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const { token } = parseBody(event);

  if (!token) {
    return jsonResponse(400, { 
      success: false, 
      error: "API token is required" 
    });
  }

  try {
    // Fetch user info for User ID
    const userResponse = await clickupFetch("/user", token);
    const user = userResponse.user || userResponse;

    // Fetch all accessible teams
    const teamsResponse = await clickupFetch("/team", token);
    const teams = teamsResponse.teams || [];

    return jsonResponse(200, {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      teams: teams.map(t => ({
        id: String(t.id),
        name: t.name,
        color: t.color,
        memberCount: t.members?.length || 0,
      })),
    });

  } catch (error) {
    console.error("[List Teams] Error:", error);
    const status = error.status || 500;
    let errorMessage = "Failed to fetch teams";
    
    if (status === 401) {
      errorMessage = "Invalid API token. Please check your token.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return jsonResponse(status, {
      success: false,
      error: errorMessage,
    });
  }
};
