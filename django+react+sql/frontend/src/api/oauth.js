// Read OAuth app config from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "YOUR_GITHUB_CLIENT_ID";
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

// Build the URL that sends users to Google for authorization
export const getGoogleAuthUrl = () => {
  const redirectUri = `${FRONTEND_URL}/auth/callback/google`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Build the URL that sends users to GitHub for authorization
export const getGitHubAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${FRONTEND_URL}/auth/callback/github`,
    scope: "user:email",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

// NOTE: The OAuthCallback React component (which uses JSX) lives in oauth.jsx
