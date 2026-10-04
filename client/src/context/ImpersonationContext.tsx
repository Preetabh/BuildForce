import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ViewingUser {
  id?: string;
  name: string;
  email: string;
  role?: string;
  mobile?: string;
}

interface ImpersonationContextType {
  viewingUser: ViewingUser | null;
  startViewing: (user: ViewingUser) => void;
  stopViewing: () => void;
  isViewing: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewingUser, setViewingUser] = useState<ViewingUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('infrapilot_viewing_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.email?.includes('anjali@') ||
          parsed.email?.includes('aman@') ||
          parsed.name?.includes('Anjali') ||
          parsed.name?.includes('Aman')
        ) {
          sessionStorage.removeItem('infrapilot_viewing_user');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const startViewing = (user: ViewingUser) => {
    setViewingUser(user);
    try {
      sessionStorage.setItem('infrapilot_viewing_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  const stopViewing = () => {
    setViewingUser(null);
    try {
      sessionStorage.removeItem('infrapilot_viewing_user');
    } catch {
      // ignore
    }
  };

  return (
    <ImpersonationContext.Provider
      value={{
        viewingUser,
        startViewing,
        stopViewing,
        isViewing: !!viewingUser,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = (): ImpersonationContextType => {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
};
