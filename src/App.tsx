import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Donate from './pages/Donate';
import { ReadingProvider } from './context/ReadingContext';

export default function App() {
  return (
    <ReadingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/donate" element={<Donate />} />
        </Routes>
      </BrowserRouter>
    </ReadingProvider>
  );
}
