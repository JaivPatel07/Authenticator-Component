import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/',
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Auth ───────────────────────────────────────────────────────────────────

export const registerUser = async (data) => {
  try {
    const response = await api.post('register/', data);
    return response.data;
  } catch (error) {
    const respData = error.response?.data;
    let message = 'Registration failed. Please try again.';
    if (respData) {
      if (typeof respData === 'string') {
        message = respData;
      } else if (respData.detail) {
        message = respData.detail;
      } else if (respData.message) {
        message = respData.message;
      } else {
        const fieldErrors = Object.entries(respData)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
        if (fieldErrors) message = fieldErrors;
      }
    }
    throw new Error(message);
  }
};

export const loginUser = async (data) => {
  try {
    const response = await api.post('login/', data);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.non_field_errors?.join(', ') ||
      'Login failed. Please check your credentials.';
    throw new Error(message);
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post('login/verify/', { email, otp });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Invalid or expired verification code.';
    throw new Error(message);
  }
};

export const logoutUser = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('logout/', { refresh: refreshToken });
  } catch (error) {
    console.error('Logout failed', error);
  }
};

// ── OAuth ──────────────────────────────────────────────────────────────────

export const googleLogin = async (code, redirectUri, action = 'login') => {
  try {
    const response = await api.post('auth/google/', { code, redirect_uri: redirectUri, action });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Google login failed.';
    throw new Error(message);
  }
};

export const githubLogin = async (code, action = 'login') => {
  try {
    const response = await api.post('auth/github/', { code, action });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'GitHub login failed.';
    throw new Error(message);
  }
};

// ── Password Reset ─────────────────────────────────────────────────────────

export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post('password-reset/', { email });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to request password reset.';
    throw new Error(message);
  }
};

export const confirmPasswordReset = async (uidb64, token, password) => {
  try {
    const response = await api.post('password-reset-confirm/', { uidb64, token, password });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to reset password.';
    throw new Error(message);
  }
};

// ── User Profile ───────────────────────────────────────────────────────────

export const updateUserProfile = async (data) => {
  try {
    const response = await api.put('user/', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to update profile.';
    throw new Error(message);
  }
};

export const deleteUserAccount = async () => {
  try {
    const response = await api.delete('user/');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to delete account.';
    throw new Error(message);
  }
};

export default api;