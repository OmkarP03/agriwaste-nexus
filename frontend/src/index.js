import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LangProvider } from './context/LangContext';
import 'leaflet/dist/leaflet.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>
);

/* Offline support.
 *
 * Registered only in a production build: a service worker in front of the
 * dev server caches the hot-reload bundle and makes edits stop appearing.
 */
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .catch(err => console.log('Service worker not registered:', err.message));
  });
}
