import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/geist';
import '@fontsource-variable/fraunces/opsz-italic.css';
import './styles/global.css';
import App from './App';
import { initRouter } from './state/router';
import { trackFontLoading } from './lib/fonts';

initRouter();
trackFontLoading();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
