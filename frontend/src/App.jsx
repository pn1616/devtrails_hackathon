import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import OAuthFlow from './pages/OAuthFlow';
import PlanSelection from './pages/PlanSelection';
import Dashboard from './pages/Dashboard';
import ClaimsPage from './pages/ClaimsPage';
import AutopaySimulator from './pages/AutopaySimulator';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

/* ─────────────────────────────────────────────────────────
   Worker flow: state-machine navigation (existing behaviour)
───────────────────────────────────────────────────────── */
function WorkerApp() {
  const [page, setPage] = useState('landing');
  const [worker, setWorker] = useState(null);
  const [policy, setPolicy] = useState(null);

  const navigate = (p) => setPage(p);

  return (
    <div className="app">
      {page === 'landing'   && <Landing   navigate={navigate} />}
      {page === 'oauth'     && <OAuthFlow  navigate={navigate} setWorker={setWorker} />}
      {page === 'plans'     && <PlanSelection navigate={navigate} worker={worker} setPolicy={setPolicy} />}
      {page === 'dashboard' && <Dashboard navigate={navigate} worker={worker} policy={policy} />}
      {page === 'claims'    && <ClaimsPage navigate={navigate} worker={worker} policy={policy} />}
      {page === 'autopay'   && <AutopaySimulator navigate={navigate} worker={worker} policy={policy} setPolicy={setPolicy} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Root: React Router wiring
   "/" → Worker flow   "/admin" → Admin Dashboard
───────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<WorkerApp />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* Fallback */}
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
