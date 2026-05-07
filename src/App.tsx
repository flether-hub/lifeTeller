import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Donate from './pages/Donate';
import { ReadingProvider } from './context/ReadingContext';
import { LanguageProvider } from './context/LanguageContext';
import { QuotaProvider } from './context/QuotaContext';

export default function App() {
  useEffect(() => {
    // Generate a permanent browser cookie for quota tracking if not present
    const cookies = document.cookie;
    if (!cookies.includes('user_uid=')) {
      const uid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      document.cookie = `user_uid=${uid}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
  }, []);

  return (
    <LanguageProvider>
      <QuotaProvider>
        <ReadingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin/*" element={<Admin />} />
              <Route path="/donate" element={<Donate />} />
            </Routes>
          </BrowserRouter>
        </ReadingProvider>
      </QuotaProvider>
    </LanguageProvider>
  );
}
