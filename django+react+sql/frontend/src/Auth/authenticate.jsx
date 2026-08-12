import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, verifyOTP, registerUser } from "../services/api";
import { useAuth } from "./AuthContext";
import { getGoogleAuthUrl, getGitHubAuthUrl } from "../api/oauth";

// ── Icons ──────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

// ── Password Strength ──────────────────────────────────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { score: 1, label: "Weak", color: "bg-red-500" },
    { score: 2, label: "Fair", color: "bg-yellow-500" },
    { score: 3, label: "Good", color: "bg-blue-500" },
    { score: 4, label: "Strong", color: "bg-green-500" },
  ];
  return levels[score - 1] || { score: 0, label: "", color: "" };
};

// ── Social Buttons ─────────────────────────────────────────────────────────
const SocialButtons = ({ action }) => (
  <>
    <div className="flex items-center my-6 gap-3">
      <div className="flex-grow border-t border-gray-200" />
      <span className="text-xs text-gray-400 whitespace-nowrap">or continue with</span>
      <div className="flex-grow border-t border-gray-200" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <a
        href={getGoogleAuthUrl(action)}
        className="flex items-center justify-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
      >
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google
      </a>
      <a
        href={getGitHubAuthUrl(action)}
        className="flex items-center justify-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
        GitHub
      </a>
    </div>
  </>
);

// ── Password Input ─────────────────────────────────────────────────────────
const PasswordInput = ({ id, name, placeholder, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};

// ── Alert ──────────────────────────────────────────────────────────────────
const Alert = ({ type, message }) => {
  if (!message) return null;
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-green-50 border-green-200 text-green-700",
  };
  return (
    <div className={`mb-5 rounded-xl border p-3 text-sm text-center ${styles[type]}`}>
      {message}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
function Authenticate() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [step, setStep] = useState("form"); // "form" | "otp" (login flow only)

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpEmail, setOtpEmail] = useState("");

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Shared UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, openRegisterModal } = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const switchTab = (t) => {
    setTab(t);
    setStep("form");
    clearMessages();
  };

  // ── Login ──────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const response = await loginUser({ email: loginEmail, password: loginPassword });
      if (response.otp_required) {
        setOtpEmail(response.email);
        setSuccessMessage(`Verification code sent to ${response.email}`);
        setStep("otp");
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP ────────────────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpValues];
    updated[index] = value.slice(-1);
    setOtpValues(updated);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const updated = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtpValues(updated);
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    const otp = otpValues.join("");
    if (otp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const response = await verifyOTP(otpEmail, otp);
      login(response);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.message);
      setOtpValues(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!agreeTerms) {
      setErrorMessage("Please accept the Terms of Service to continue.");
      return;
    }
    const strength = getPasswordStrength(regPassword);
    if (strength.score < 2) {
      setErrorMessage("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    try {
      const response = await registerUser({ username: regUsername, email: regEmail, password: regPassword });
      setSuccessMessage(response.message || "Account created! You can now log in.");
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
      setAgreeTerms(false);
      setTimeout(() => switchTab("login"), 2500);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(regPassword);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === "otp" ? "Check your email" : tab === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === "otp"
              ? `We sent a 6-digit code to ${otpEmail}`
              : tab === "login"
              ? "Sign in to continue"
              : "Join us today — it's free"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* ── OTP Step ── */}
          {step === "otp" ? (
            <>
              <Alert type="success" message={successMessage} />
              <Alert type="error" message={errorMessage} />
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      ref={(el) => (inputRefs.current[i] = el)}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading || otpValues.join("").length < 6}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying…" : "Verify & Sign In"}
                </button>
              </form>
              <button
                onClick={() => { setStep("form"); clearMessages(); setOtpValues(["", "", "", "", "", ""]); }}
                className="mt-5 w-full text-center text-sm text-gray-500 hover:text-blue-600 transition"
              >
                ← Back to login
              </button>
            </>
          ) : (
            <>
              {/* ── Tab Switcher ── */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-7">
                {["login", "register"].map((t) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                      tab === t ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              <Alert type="error" message={errorMessage} />
              <Alert type="success" message={successMessage} />

              {/* ── Login Form ── */}
              {tab === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <PasswordInput
                      id="login-password"
                      name="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending code…" : "Sign In"}
                  </button>

                  <SocialButtons action="login" />
                </form>
              )}

              {/* ── Register Form ── */}
              {tab === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Username
                    </label>
                    <input
                      id="reg-username"
                      type="text"
                      placeholder="Choose a username"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <PasswordInput
                      id="reg-password"
                      name="password"
                      placeholder="Create a strong password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                    {/* Password strength meter */}
                    {regPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((lvl) => (
                            <div
                              key={lvl}
                              className={`h-1.5 flex-1 rounded-full transition-all ${
                                strength.score >= lvl ? strength.color : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            Strength: <span className={`font-medium ${strength.score >= 3 ? "text-green-600" : strength.score === 2 ? "text-yellow-600" : "text-red-600"}`}>{strength.label || "Too weak"}</span>
                          </span>
                          <span>Min. 8 characters</span>
                        </div>
                      </div>
                    )}
                    {/* Password hints */}
                    {regPassword && (
                      <ul className="mt-2 space-y-1">
                        {[
                          { test: regPassword.length >= 8, label: "At least 8 characters" },
                          { test: /[A-Z]/.test(regPassword), label: "One uppercase letter" },
                          { test: /[0-9]/.test(regPassword), label: "One number" },
                          { test: /[^A-Za-z0-9]/.test(regPassword), label: "One special character" },
                        ].map(({ test, label }) => (
                          <li key={label} className={`flex items-center gap-1.5 text-xs ${test ? "text-green-600" : "text-gray-400"}`}>
                            <CheckIcon className={`w-3.5 h-3.5 flex-shrink-0 ${test ? "text-green-500" : "text-gray-300"}`} />
                            {label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Terms checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        id="agree-terms"
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                        {agreeTerms && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 leading-relaxed">
                      I agree to the{" "}
                      <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span>
                      {" "}and{" "}
                      <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !agreeTerms}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating account…" : "Create Account"}
                  </button>

                  <SocialButtons action="signup" />
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our{" "}
          <span className="text-blue-500 cursor-pointer hover:underline">Terms</span> &amp;{" "}
          <span className="text-blue-500 cursor-pointer hover:underline">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

export default Authenticate;