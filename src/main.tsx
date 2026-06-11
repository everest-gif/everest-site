import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/fraunces/wght.css';
import './styles/global.css';
import App from './App';
import { initRouter } from './state/router';
import { trackFontLoading } from './lib/fonts';
import { initAudio } from './lib/audio';
import { useStore } from './state/store';

initRouter();
trackFontLoading();
initAudio();

if (import.meta.env.DEV) {
  const log: Array<{ t: number; act: string }> = [];
  (window as unknown as Record<string, unknown>).__actLog = log;
  useStore.subscribe((s, prev) => {
    if (s.act !== prev.act) log.push({ t: performance.now(), act: s.act });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
