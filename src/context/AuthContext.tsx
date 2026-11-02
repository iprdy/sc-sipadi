import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { DEMO_USER } from '../mocks/data';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sipadi_demo_user');
    return saved ? JSON.parse(saved) : DEMO_USER;
  });

  const isAuthenticated = !!user;

  const login = async (email: string) => {
    // Simulated auth delay
    await new Promise((r) => setTimeout(r, 400));
    const profile: UserProfile = {
      ...DEMO_USER,
      email: email.trim() || DEMO_USER.email,
    };
    setUser(profile);
    localStorage.setItem('sipadi_demo_user', JSON.stringify(profile));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sipadi_demo_user');
  };

  useEffect(() => {
    // Keep local storage synced
    if (user) {
      localStorage.setItem('sipadi_demo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sipadi_demo_user');
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
