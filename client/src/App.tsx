import React, { useEffect } from 'react';
import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { escapeManager } from './utils/escapeKeyManager';

export function App() {
  useEffect(() => {
    escapeManager.init();
  }, []);

  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
