import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // Import the service worker registration module

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Check that service workers are supported
if ('serviceWorker' in navigator) {
	// console.log('time sw')
  window.addEventListener('load', () => {
  //   // Register the Firebase Messaging Service Worker
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('App: Firebase Messaging Service Worker registered! Scope is:', registration.scope);
      })
      .catch(err => {
        console.log('App: Firebase Messaging Service Worker registration failed:', err);
        // Add your error handling code here if needed.
        // alert('Failed to register Firebase Messaging Service Worker. Some features may not work properly.');
      });

    // Register the PWA Service Worker using the serviceWorkerRegistration module
  });
}

serviceWorkerRegistration.register()