import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = `${API_ROOT}/api/auth`;

/** Attach or clear the bearer token used by every axios request. */
function applyToken(token) {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore the session ──────────────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('agri_user');
    const savedToken = localStorage.getItem('token');

    // A saved user without a token can no longer talk to the API, so it
    // isn't a session — clear it rather than showing a signed-in shell
    // whose every request fails.
    if (savedUser && savedToken) {
      applyToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else if (savedUser) {
      localStorage.removeItem('agri_user');
    }

    setLoading(false);
  }, []);

  // ── An expired or rejected token ends the session ────────
  useEffect(() => {
    const id = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('agri_user');
          localStorage.removeItem('token');
          applyToken(null);
          setUser(null);
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  function startSession(token, nextUser) {
    localStorage.setItem('token', token);
    localStorage.setItem('agri_user', JSON.stringify(nextUser));
    applyToken(token);
    setUser(nextUser);
  }

  async function register(formData) {
    try {
      const response = await axios.post(`${API_URL}/register`, formData);

      // The server decides the role — asking for 'admin' here gets you 'farmer'
      startSession(response.data.token, response.data.user);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed',
      };
    }
  }

  async function login({ email, password }) {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });

      startSession(response.data.token, response.data.user);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed',
      };
    }
  }

  function logout() {
    localStorage.removeItem('agri_user');
    localStorage.removeItem('token');
    applyToken(null);
    setUser(null);
  }

  async function updateProfile(updates) {
    try {
      const response = await axios.put(
        `${API_URL}/update-profile/${user._id}`,
        updates
      );

      localStorage.setItem('agri_user', JSON.stringify(response.data.user));
      setUser(response.data.user);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Profile update failed',
      };
    }
  }

  async function saveCalculation(result, inputs) {
    if (!user) return false;

    try {
      // userId comes from the token server-side; sending it would be ignored
      await axios.post(`${API_ROOT}/api/calculations/save`, { inputs, result });
      return true;
    } catch (err) {
      console.log('SAVE CALCULATION FAILED', err.response?.data || err.message);
      return false;
    }
  }

  // ── Password reset ──────────────────────────────────────
  async function requestPasswordReset(email) {
    try {
      const response = await axios.post(`${API_URL}/forgot-password/request`, { email });
      return { success: true, ...response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Could not reach the server. Is the backend running?',
        retryAfter: err.response?.data?.retryAfter,
      };
    }
  }

  async function verifyResetOtp({ email, otp }) {
    try {
      const response = await axios.post(`${API_URL}/forgot-password/verify`, { email, otp });
      return { success: true, resetToken: response.data.resetToken };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Could not verify the code. Try again.',
      };
    }
  }

  async function resetPassword({ resetToken, newPassword }) {
    try {
      const response = await axios.post(`${API_URL}/forgot-password/reset`, { resetToken, newPassword });
      return { success: true, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Could not reset the password. Try again.',
      };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user, loading, register, login, logout, updateProfile, saveCalculation,
        requestPasswordReset, verifyResetOtp, resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
