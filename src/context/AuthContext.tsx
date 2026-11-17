import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const token = localStorage.getItem('sipadi_token');
    const saved = localStorage.getItem('sipadi_user_profile');
    if (saved && token && token !== 'demo-admin-token') {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem('sipadi_user_profile');
      }
    }
    localStorage.removeItem('sipadi_user_profile');
    localStorage.removeItem('sipadi_admin_token');
    return null; // Not logged in by default
  });

  const isAuthenticated = !!user;

  const login = async (email: string, password: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      const isAdmin = data.user.role === 'admin';
      const profile: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatarInitials: isAdmin ? 'AD' : 'WS',
      };

      setUser(profile);
      localStorage.setItem('sipadi_user_profile', JSON.stringify(profile));
      localStorage.setItem('sipadi_token', data.access_token);
      if (isAdmin) {
        localStorage.setItem('sipadi_admin_token', data.access_token);
      }
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sipadi_user_profile');
    localStorage.removeItem('sipadi_demo_user');
    localStorage.removeItem('sipadi_token');
    localStorage.removeItem('sipadi_admin_token');
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('sipadi_user_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('sipadi_user_profile');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
