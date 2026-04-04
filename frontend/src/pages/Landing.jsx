import React from 'react';

export default function Landing({ navigate }) {
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛡️</div>
        <div className="logo" style={{ fontSize: 36, marginBottom: 8 }}>GigShield</div>
        <div style={{ fontSize: 15, color: '#999', lineHeight: 1.6 }}>
          AI-powered parametric income protection<br />for Q-Commerce delivery partners
        </div>
      </div>

      <div className="card-teal" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>Meet Raju — Zepto partner, Pune</div>
        <div style={{ fontSize: 15, lineHeight: 1.6 }}>
          On July 14, 2024 — extreme rain halted deliveries for 8 hours.
          <span className="teal" style={{ fontWeight: 600 }}> Raju lost ₹560 in a single day</span> — with zero compensation and no safety net.
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: '#999' }}>
          Over monsoon season: ₹4,200–₹6,800 in lost income.
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value">15M+</div>
          <div className="stat-label">gig workers in India</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹0</div>
          <div className="stat-label">income protection exists</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">20-30%</div>
          <div className="stat-label">monthly income lost</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">&lt;3 min</div>
          <div className="stat-label">GigShield payout time</div>
        </div>
      </div>

      <button className="btn-primary" onClick={() => navigate('oauth')}>
        Get Protected — Connect with Zepto
      </button>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 12 }}>
        3 taps · Under 2 minutes · No forms
      </div>
    </div>
  );
}
