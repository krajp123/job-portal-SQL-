import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '../socket';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

function clearStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function getStoredUser() {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (!token || !storedUser) {
    clearStoredSession();
    return null;
  }

  try {
    const tokenPayload = token.split('.')[1];
    const normalizedPayload = tokenPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    const decodedPayload = atob(paddedPayload);
    const { exp } = JSON.parse(decodedPayload);

    // Check if token is expired
    if (typeof exp === 'number' && exp * 1000 <= Date.now()) {
      clearStoredSession();
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    clearStoredSession();
    return null;
  }
}

// Helper to check if token is expired without throwing
function isTokenExpired() {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  try {
    const tokenPayload = token.split('.')[1];
    const normalizedPayload = tokenPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    const decodedPayload = atob(paddedPayload);
    const { exp } = JSON.parse(decodedPayload);
    
    return typeof exp === 'number' && exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    if (user?.role !== 'recruiter') return;
    let active = true;
    axiosInstance.get('/recruiter/me/profile')
      .then(({ data }) => {
        if (!active || !data?.workspaceAccess) return;
        setUser((current) => {
          const updated = { ...current, workspaceAccess: data.workspaceAccess };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [user?.role]);

  // Reconnect the socket automatically on a page refresh if a token is
  // already present (i.e. the user was already logged in).
  useEffect(() => {
    if (localStorage.getItem('token')) connectSocket();

    function handleUnauthorized() {
      logout({ redirect: true });
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Periodic token expiration check (every 1 minute) to catch expiration
    // even if the setTimeout below doesn't fire. IMPORTANT: only run this
    // when a token actually exists — isTokenExpired() returns `true` for
    // "no token" too (not just "expired token"), so without this guard it
    // force-redirects every anonymous visitor on every public page
    // (resume-registration, job search, home, etc.) to '/' after 60s.
    const tokenCheckInterval = setInterval(() => {
      if (localStorage.getItem('token') && isTokenExpired()) {
        logout({ redirect: true });
      }
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      clearInterval(tokenCheckInterval);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    try {
      const tokenPayload = token.split('.')[1];
      const normalizedPayload = tokenPayload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
      const decodedPayload = atob(paddedPayload);
      const { exp } = JSON.parse(decodedPayload);

      if (typeof exp !== 'number') return undefined;

      const msUntilExpiry = exp * 1000 - Date.now();
      if (msUntilExpiry <= 0) {
        logout({ redirect: true });
        return undefined;
      }

      const timer = setTimeout(() => logout({ redirect: true }), msUntilExpiry);
      return () => clearTimeout(timer);
    } catch {
      logout({ redirect: true });
      return undefined;
    }
  }, [user]);

  function login({ token, role, ...rest }) {
    localStorage.setItem('token', token);
    const userData = { role, ...rest };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    connectSocket();
  }

  function logout({ redirect = false } = {}) {
    clearStoredSession();
    setUser(null);
    disconnectSocket();
    if (redirect) {
      window.location.replace('/');
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}