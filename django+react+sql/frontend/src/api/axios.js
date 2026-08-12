import api from "../services/api";

export const registerUser = async (data) => {
  try {
    const response = await api.post("register/", data);

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Registration failed. Please try again.";

    throw new Error(message);
  }
};

export const loginUser = async (data) => {
  try {
    const response = await api.post("login/", data);
    return response.data; // returns { otp_required: true, email: '...' }
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.non_field_errors?.join(", ") ||
      "Login failed. Please check your credentials.";
    throw new Error(message);
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post("login/verify/", { email, otp });
    return response.data; // returns { access, refresh, user }
  } catch (error) {
    const message =
      error.response?.data?.error ||
      "Invalid or expired verification code.";
    throw new Error(message);
  }
};

export const googleLogin = async (code, redirectUri, action = 'login') => {
  try {
    const response = await api.post("auth/google/", { code, redirect_uri: redirectUri, action });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || "Google login failed.";
    throw new Error(message);
  }
};

export const githubLogin = async (code, action = 'login') => {
  try {
    const response = await api.post("auth/github/", { code, action });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || "GitHub login failed.";
    throw new Error(message);
  }
};

export const logoutUser = async () => {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        await api.post('logout/', { refresh: refreshToken });
    } catch (error) {
        console.error('Logout failed', error);
        // Even if server logout fails, we log out on the client
    }
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post("password-reset/", { email });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || "Failed to request password reset.";
    throw new Error(message);
  }
};

export const confirmPasswordReset = async (uidb64, token, password) => {
  try {
    const response = await api.post("password-reset-confirm/", { uidb64, token, password });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || "Failed to reset password.";
    throw new Error(message);
  }
};

export default api;