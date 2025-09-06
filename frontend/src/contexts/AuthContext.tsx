import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('ecofinds_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    const users = JSON.parse(localStorage.getItem('ecofinds_users') || '[]');
    const user = users.find((u: User) => u.email === email);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('ecofinds_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const register = async (email: string, password: string, username: string): Promise<boolean> => {
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('ecofinds_users') || '[]');
    if (users.some((u: User) => u.email === email)) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      username,
      fullName: username,
      phone: '',
      address: '',
      bio: '',
      joinedDate: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('ecofinds_users', JSON.stringify(users));
    setCurrentUser(newUser);
    localStorage.setItem('ecofinds_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ecofinds_user');
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser };
      setCurrentUser(newUser);
      localStorage.setItem('ecofinds_user', JSON.stringify(newUser));
      
      // Update in users list
      const users = JSON.parse(localStorage.getItem('ecofinds_users') || '[]');
      const userIndex = users.findIndex((u: User) => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex] = newUser;
        localStorage.setItem('ecofinds_users', JSON.stringify(users));
      }
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};