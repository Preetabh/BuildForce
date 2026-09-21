import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Company, AuthState } from '../types';
import api from '../services/api';

interface AuthContextType extends AuthState {
  login: (token: string, user: User, company: Company) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('civil_erp_token');
    const savedUser = localStorage.getItem('civil_erp_user');
    const savedCompany = localStorage.getItem('civil_erp_company');

    if (savedToken && savedUser && savedCompany) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setCompany(JSON.parse(savedCompany));
      } catch (err) {
        console.error('Failed to parse saved user credentials', err);
        localStorage.removeItem('civil_erp_token');
        localStorage.removeItem('civil_erp_user');
        localStorage.removeItem('civil_erp_company');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newCompany: Company) => {
    localStorage.setItem('civil_erp_token', newToken);
    localStorage.setItem('civil_erp_user', JSON.stringify(newUser));
    localStorage.setItem('civil_erp_company', JSON.stringify(newCompany));
    setToken(newToken);
    setUser(newUser);
    setCompany(newCompany);
  };

  const logout = () => {
    localStorage.removeItem('civil_erp_token');
    localStorage.removeItem('civil_erp_user');
    localStorage.removeItem('civil_erp_company');
    setToken(null);
    setUser(null);
    setCompany(null);
    window.location.href = '/login';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('civil_erp_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
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
