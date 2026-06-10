import { clickupFetch, jsonResponse, parseBody, handleOptions } from "./_helpers.js";

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const { token, teamId } = parseBody(event);

  if (!token) {
    return jsonResponse(400, { 
      success: false, 
      error: "API token is required" 
    });
  }

  try {
    // Step 1: Validate token by getting user info
    const userResponse = await clickupFetch("/user", token);
    const user = userResponse.user || userResponse;

    // Step 2: If teamId provided, also verify team access
    let teamInfo = null;
    if (teamId) {
      try {
        const teamsResponse = await clickupFetch("/team", token);
        const teams = teamsResponse.teams || [];
        teamInfo = teams.find(t => String(t.id) === String(teamId));
        
        if (!teamInfo) {
          return jsonResponse(403, {
            success: false,
            error: `Team ID ${teamId} not found in your accessible teams`,
            availableTeams: teams.map(t => ({ id: t.id, name: t.name })),
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
            },
          });
        }
      } catch (teamErr) {
        // Token works but team check failed
        console.error("Team check error:", teamErr);
      }
    }

    return jsonResponse(200, {
      success: true,
      message: "Connection successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        color: user.color,
        profilePicture: user.profilePicture,
      },
      team: teamInfo ? {
        id: teamInfo.id,
        name: teamInfo.name,
        color: teamInfo.color,
      } : null,
    });

  } catch (error) {
    console.error("ClickUp test error:", error);
    
    const status = error.status || 500;
    let errorMessage = "Failed to connect to ClickUp";
    
    if (status === 401) {
      errorMessage = "Invalid API token. Please check your token and try again.";
    } else if (status === 403) {
      errorMessage = "Access denied. Token may not have required permissions.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return jsonResponse(status, {
      success: false,
      error: errorMessage,
      details: error.clickupError || null,
    });
  }
};
