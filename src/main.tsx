import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './app/App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { msalInstance } from './lib/auth';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

async function bootstrap() {
  try {
    await msalInstance.initialize();
    await msalInstance.handleRedirectPromise();
  } catch (err) {
    // Clear any stale auth response hash so MsalProvider's internal
    // handleRedirectPromise call doesn't replay the same failure.
    console.error('MSAL redirect handling failed:', err);
    if (window.location.hash) {
      history.replaceState({}, '', window.location.pathname + window.location.search);
    }
  }

  ReactDOM.createRoot(rootElement!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

bootstrap();
