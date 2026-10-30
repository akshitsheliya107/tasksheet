import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const PROJECT_ID = "update-dai-dyo-lyo";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function getAdminAuth() {
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error("Missing FIREBASE_ADMIN_SERVICE_ACCOUNT configuration");
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT must be valid JSON");
  }

  if (serviceAccount.project_id !== PROJECT_ID) {
    throw new Error("Firebase Admin credentials are for the wrong project");
  }

  const app = getApps()[0] || initializeApp({
    credential: cert(serviceAccount),
    projectId: PROJECT_ID,
  });
  return getAuth(app);
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const adminUid = process.env.FIREBASE_ADMIN_UID;
  if (!adminUid) {
    console.error("Missing FIREBASE_ADMIN_UID configuration");
    return jsonResponse(503, { error: "Admin panel is not configured" });
  }

  const authorization = event.headers?.authorization || event.headers?.Authorization;
  const idToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!idToken) {
    return jsonResponse(401, { error: "Authentication required" });
  }

  let auth;
  try {
    auth = getAdminAuth();
  } catch (error) {
    console.error("Admin backend configuration failed:", error.message);
    return jsonResponse(503, { error: "Admin panel server configuration is invalid" });
  }

  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken, true);
  } catch (error) {
    console.error("Admin token verification failed:", error.code || error.message);
    return jsonResponse(401, { error: "Invalid or expired session. Please sign in again." });
  }

  if (decodedToken.uid !== adminUid) {
    return jsonResponse(403, { error: "This account is not authorized to use the admin panel." });
  }

  let request;
  try {
    request = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid request body" });
  }

  try {
    if (request.action === "listUsers") {
      const pageToken = typeof request.pageToken === "string" ? request.pageToken : undefined;
      const page = await auth.listUsers(1000, pageToken);
      return jsonResponse(200, {
        users: page.users.map((user) => ({
          uid: user.uid,
          email: user.email || "",
          createdAt: user.metadata.creationTime || null,
          lastSignInTime: user.metadata.lastSignInTime || null,
        })),
        nextPageToken: page.pageToken || null,
      });
    }

    if (request.action === "setTemporaryPassword") {
      const { uid, password } = request;
      if (typeof uid !== "string" || !uid || typeof password !== "string") {
        return jsonResponse(400, { error: "User and password are required" });
      }
      if (uid === adminUid) {
        return jsonResponse(400, { error: "You cannot reset the admin account from this panel." });
      }
      if (password.length < 12 || password.length > 128) {
        return jsonResponse(400, { error: "Password must be between 12 and 128 characters." });
      }

      const targetUser = await auth.getUser(uid);
      if (targetUser.customClaims?.admin === true) {
        return jsonResponse(400, { error: "Admin accounts cannot be reset from this panel." });
      }

      await auth.updateUser(uid, { password });
      try {
        await auth.revokeRefreshTokens(uid);
      } catch (error) {
        console.error("Password changed but session revocation failed:", error.code || error.message);
        return jsonResponse(500, {
          error: "Password was changed, but existing sessions could not be signed out. Contact support before sharing it.",
        });
      }
      console.info("Admin password reset completed", {
        adminUid: decodedToken.uid,
        targetUid: uid,
      });
      return jsonResponse(200, { success: true });
    }

    return jsonResponse(400, { error: "Unknown admin action" });
  } catch (error) {
    console.error("Admin user operation failed:", error.code || error.message);
    if (error.code === "auth/user-not-found") {
      return jsonResponse(404, { error: "User account was not found." });
    }
    if (error.code === "auth/invalid-password") {
      return jsonResponse(400, { error: "Firebase rejected this password. Use a stronger password." });
    }
    return jsonResponse(500, { error: "Could not complete the admin request." });
  }
};
