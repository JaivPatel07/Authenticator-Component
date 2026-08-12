import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { googleLogin, githubLogin } from "./axios";

// Read OAuth app config from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "YOUR_GITHUB_CLIENT_ID";
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

// Build the URL that sends users to Google for authorization
export const getGoogleAuthUrl = (action = 'login') => {
  const redirectUri = `${FRONTEND_URL}/auth/callback/google`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state: action,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Build the URL that sends users to GitHub for authorization
export const getGitHubAuthUrl = (action = 'login') => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${FRONTEND_URL}/auth/callback/github`,
    scope: "user:email",
    state: action,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

// OAuthCallback: handles /auth/callback/google and /auth/callback/github
export function OAuthCallback({ login }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const provider = location.pathname.includes("google") ? "google" : "github";

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const action = searchParams.get("state") || "login";

    if (error || !code) {
      setErrorMessage(`Authorization was denied or failed: ${error || "No code received."}`);
      setLoading(false);
      return;
    }

    const handleCallback = async () => {
      try {
        let response;
        if (provider === "google") {
          const redirectUri = `${FRONTEND_URL}/auth/callback/google`;
          response = await googleLogin(code, redirectUri, action);
        } else {
          response = await githubLogin(code, action);
        }
        login(response);
        navigate("/dashboard");
      } catch (err) {
        setErrorMessage(err.message);
        setLoading(false);
      }
    };

    handleCallback();
  }, []);

  if (loading && !errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-lg">
          Completing {provider === "google" ? "Google" : "GitHub"} login...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md text-center">
        <div className="text-red-500 text-5xl mb-4">✗</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Login Failed</h1>
        <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
        <a
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}
