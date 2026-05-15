/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Update import paths to point to files within the 'src' directory, which contains the correct modules. The filenames were also corrected.
import { LiveAPIProvider } from './src/contexts/LiveAPIProvider';
import { SettingsProvider } from './src/contexts/SettingsContext';
import App from './src/App';
import './src/index.css';

const RootComponent = () => {
  const [hasKey, setHasKey] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore - aistudio is injected by the platform
      if (window.aistudio?.hasSelectedApiKey) {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected || !!process.env.API_KEY || !!process.env.GEMINI_API_KEY);
      } else {
        setHasKey(!!process.env.API_KEY || !!process.env.GEMINI_API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  if (hasKey === null) return null;

  if (!hasKey) {
    return (
      <div className="error-screen">
        <p>API Key is required to chat with the pieces.</p>
        <button 
          className="link-button" 
          onClick={handleOpenSelectKey}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--accent)', color: 'white', borderRadius: '4px' }}
        >
          Select API Key
        </button>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dark)' }}>
          You can also set GEMINI_API_KEY in the Secrets panel.
        </p>
      </div>
    );
  }

  return (
    <LiveAPIProvider apiKey={process.env.API_KEY || process.env.GEMINI_API_KEY || ""}>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </LiveAPIProvider>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
