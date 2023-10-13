import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConsoleBehavior from './ConsoleBehavior';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

import './index.css';

ConsoleBehavior();

const root = createRoot(document.getElementById('root'));
root.render(<App />);

serviceWorkerRegistration.register();
