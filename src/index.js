import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConsoleBehavior from './ConsoleBehavior';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

import './index.css';

ConsoleBehavior();

const root = createRoot(document.getElementById('root'));
root.render(<App />);

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/notifications/' })
		.then(registration => {
				console.log('App: Firebase Messaging Service Worker registered! Scope is:', registration.scope);
			})
			.catch(err => {
				console.log('App: Firebase Messaging Service Worker registration failed:', err);
			});

	});
}

serviceWorkerRegistration.register()
