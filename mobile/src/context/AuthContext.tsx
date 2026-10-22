import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../services/storage';

interface AuthContextType {
  token: string | null;
  phone: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await storage.getToken();
        const savedPhone = await storage.getPhone();
        if (savedToken) {
          setToken(savedToken);
          setPhone(savedPhone);
        }
      } catch (err) {
        console.warn('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (newToken: string, userPhone: string) => {
    setToken(newToken);
    setPhone(userPhone);
    await storage.setToken(newToken);
    await storage.setPhone(userPhone);
  };

  const logout = async () => {
    setToken(null);
    setPhone(null);
    await storage.clearAll();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        phone,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
