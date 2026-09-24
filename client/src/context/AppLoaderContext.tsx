import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClassyAppLoader } from '../components/common/ClassyAppLoader';

interface AppLoaderContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
}

const AppLoaderContext = createContext<AppLoaderContextType | undefined>(undefined);

export const AppLoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always show classy boot loader on initial app load for 1.3 seconds
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [customLoadingMessage, setCustomLoadingMessage] = useState<string | undefined>(undefined);
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    // Elegant initial site launch transition
    const timer = setTimeout(() => {
      setIsBootLoading(false);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  const showLoader = (message?: string) => {
    setCustomLoadingMessage(message);
    setManualLoading(true);
  };

  const hideLoader = () => {
    setManualLoading(false);
    setCustomLoadingMessage(undefined);
  };

  const showGlobalLoader = isBootLoading || manualLoading;

  return (
    <AppLoaderContext.Provider
      value={{
        showLoader,
        hideLoader,
        isLoading: showGlobalLoader,
      }}
    >
      {children}
      {showGlobalLoader && (
        <ClassyAppLoader
          message={customLoadingMessage}
          isInitialBoot={isBootLoading}
          minDurationMs={isBootLoading ? 1100 : 500}
          onFinish={() => {
            if (isBootLoading) setIsBootLoading(false);
            if (manualLoading) setManualLoading(false);
          }}
        />
      )}
    </AppLoaderContext.Provider>
  );
};

export const useAppLoader = (): AppLoaderContextType => {
  const context = useContext(AppLoaderContext);
  if (!context) {
    throw new Error('useAppLoader must be used within an AppLoaderProvider');
  }
  return context;
};
