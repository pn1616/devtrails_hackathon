import React from 'react';

export default function Dashboard({ navigate, worker, policy }) {
  const coverage = policy?.coverage || 450;
  const weeklyMax = policy?.planType === 'Basic' ? 1000 : policy?.planType === 'Elite' ? 3500 : 2000;
  const earnings = worker?.lastWeekEarnings || 6500;
  const dynamicCoverage = Math.min(weeklyMax, earnings * 0.4);

  const payoutHistory = [
    { date: 'Mar 14', trigger: 'Heavy Rain', amount: 450, status: 'paid' },
    { date: 'Feb 28', trigger: 'Platform Outage', amount: 360, status: 'paid' },
    { date: 'Feb 12', trigger: 'Extreme Heat', amount: 315, status: 'paid' },
  ];

  return (
    <div className="page">
      <div className="header">
        <div className="logo">GigShield</div>
        <span className="badge badge-green">● Active</span>
      </div>

      {/* Coverage Status */}
      <div className="card-teal" style={{ marginBottom: 16 }}>
        <div className="profile-row">
          <div className="avatar">{worker?.name?.[0] || 'R'}</div>
          <div>
            <div className="profile-name">{worker?.name || 'Raju Kumar'}</div>
            <div className="profile-sub">{worker?.platform || 'Zepto'} · {worker?.zone || 'Pune'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>This week's coverage</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#00A896' }}>₹{dynamicCoverage.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{policy?.planType || 'Pro'} Shield · ₹{policy?.weeklyPremium || 65}/week</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#999' }}>Renews</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sunday night</div>
            <div style={{ fontSize: 11, color: '#555' }}>Auto via UPI</div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: '#555' }}>
          Coverage = 40% × ₹{earnings.toLocaleString()} verified earnings
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">₹{earnings.toLocaleString()}</div>
          <div className="stat-label">Last week earnings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹1,125</div>
          <div className="stat-label">Payouts received</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{worker?.rating || 4.6}★</div>
          <div className="stat-label">Platform rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{worker?.tenure || 8}mo</div>
          <div className="stat-label">Active tenure</div>
        </div>
      </div>

      {/* Disruption Alerts */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>⚠️ Disruption Alerts</div>
          <span className="badge badge-amber">1 Active</span>
        </div>
        <div style={{ background: '#2d1b00', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>🌧️ Heavy rain forecast — {worker?.pinCode || '411038'}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Tomorrow 2–6 PM · 65mm expected · Trigger threshold: 50mm</div>
          <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 4 }}>→ If triggered: ₹{coverage} auto-credited to your UPI</div>
        </div>
      </div>

      {/* Loyalty Milestone */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>🏆 Loyalty Milestone</div>
          <div style={{ fontSize: 12, color: '#00A896' }}>3/6 months</div>
        </div>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>3 more clean months → 20% premium discount</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '50%' }}></div>
        </div>
      </div>

      {/* Payout History */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>📋 Payout History</div>
        {payoutHistory.map((p, i) => (
          <div key={i} className="row">
            <div>
              <div style={{ fontSize: 13 }}>{p.trigger}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{p.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#22C55E' }}>+₹{p.amount}</div>
              <div style={{ fontSize: 11, color: '#22C55E' }}>✓ paid</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="bottom-nav">
        <button className="nav-btn active" onClick={() => navigate('claims')}>⚡ Simulate Claim</button>
        <button className="nav-btn" onClick={() => navigate('autopay')}>🔄 Autopay Loop</button>
      </div>
    </div>
  );
}
