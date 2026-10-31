import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean up any stale service workers in development to prevent port-sharing cache collisions
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[TWD] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[TWD] Service Worker registration failed:', error);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);

