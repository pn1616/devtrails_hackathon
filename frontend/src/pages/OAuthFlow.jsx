import React, { useState } from 'react';

const BACKEND = 'http://localhost:5000';

export default function OAuthFlow({ navigate, setWorker }) {
  const [step, setStep] = useState('select'); 
  const [workerId, setWorkerId] = useState('ZPT001');
  const [worker, setLocalWorker] = useState(null);
  const [riskScore, setRiskScore] = useState(null);

  const handleConnect = async () => {
    setStep('loading');
    try {
      const res = await fetch(`${BACKEND}/api/zepto/worker/${workerId}`);
      const data = await res.json();

      const mlRes = await fetch('http://localhost:8000/ml/risk-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_risk: data.worker.zoneRisk,
          tenure_months: data.worker.tenure,
          rating: data.worker.rating,
          claim_history: 0
        })
      });
      const mlData = await mlRes.json();

      setLocalWorker(data.worker);
      setWorker(data.worker);
      setRiskScore(mlData);
      setStep('profile');
    } catch (e) {
      const mockWorker = {
        workerId: 'ZPT001', name: 'Raju Kumar', platform: 'Zepto',
        zone: 'Kothrud, Pune', pinCode: '411038', lastWeekEarnings: 6500,
        rating: 4.6, tenure: 8, upiId: 'raju.kumar@upi',
        shiftHours: 'morning', zoneRisk: 1.2
      };
      setLocalWorker(mockWorker);
      setWorker(mockWorker);
      setRiskScore({ risk_score: 62, recommended_plan: 'Pro', reason: 'Moderate risk — Pro Shield recommended' });
      setStep('profile');
    }
  };

  if (step === 'select') return (
    <div className="page">
      <div className="header">
        <div className="logo">GigShield</div>
        <button className="back-btn" onClick={() => navigate('landing')}>← Back</button>
      </div>
      <div className="title">Connect your<br /><span className="teal">delivery account</span></div>
      <div className="subtitle">We use your existing platform account — no new registration needed.</div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">Select your platform</div>
        {['ZPT001', 'ZPT002', 'ZPT003'].map(id => (
          <div key={id}
            onClick={() => setWorkerId(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: workerId === id ? '#00A896' : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              {id === 'ZPT001' ? '🟣' : id === 'ZPT002' ? '🔴' : '🟠'}
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{id === 'ZPT001' ? 'Zepto' : id === 'ZPT002' ? 'Blinkit' : 'Swiggy Instamart'}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{id}</div>
            </div>
            {workerId === id && <div style={{ marginLeft: 'auto' }} className="teal">✓</div>}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24, fontSize: 13, color: '#666' }}>
        🔒 GigShield uses OAuth — same as "Login with Google." We only read your earnings, zone, and rating. We never store your password.
      </div>

      <button className="btn-primary" onClick={handleConnect}>
        Connect with {workerId === 'ZPT001' ? 'Zepto' : workerId === 'ZPT002' ? 'Blinkit' : 'Swiggy Instamart'} →
      </button>
    </div>
  );

  if (step === 'loading') return (
    <div className="page">
      <div className="header"><div className="logo">GigShield</div></div>
      <div className="loading">
        <div className="spinner"></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Connecting to Zepto...</div>
          <div style={{ fontSize: 13, color: '#999' }}>Pulling your verified profile</div>
        </div>
        <div className="card" style={{ width: '100%' }}>
          {['Authenticating with Zepto ✓', 'Fetching earnings history...', 'Loading zone data...', 'Calculating risk score...'].map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: i === 1 ? '#00A896' : i === 0 ? '#22C55E' : '#555', padding: '6px 0' }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="header">
        <div className="logo">GigShield</div>
        <span className="badge badge-green">Connected ✓</span>
      </div>
      <div className="title">Profile <span className="teal">verified</span></div>
      <div className="subtitle">Your Zepto data was pulled automatically. No manual entry needed.</div>

      <div className="card-teal" style={{ marginBottom: 16 }}>
        <div className="profile-row">
          <div className="avatar">{worker?.name?.[0]}</div>
          <div>
            <div className="profile-name">{worker?.name}</div>
            <div className="profile-sub">{worker?.platform} · {worker?.zone}</div>
          </div>
        </div>
        {[
          ['Last Week Earnings', `₹${worker?.lastWeekEarnings?.toLocaleString()}`],
          ['Platform Rating', `${worker?.rating} ★`],
          ['Tenure', `${worker?.tenure} months`],
          ['Active Zone', worker?.pinCode],
          ['UPI ID', worker?.upiId],
        ].map(([l, v]) => (
          <div key={l} className="row">
            <span style={{ fontSize: 13, color: '#999' }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Your Risk Score</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#00A896' }}>{riskScore?.risk_score}/100</div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${riskScore?.risk_score}%` }}></div>
        </div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
          AI Recommendation: <span className="teal" style={{ fontWeight: 600 }}>{riskScore?.recommended_plan} Shield</span> — {riskScore?.reason}
        </div>
        <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>
          Earnings-linked coverage: ₹{Math.round((worker?.lastWeekEarnings || 0) * 0.4).toLocaleString()} (40% of last week)
        </div>
      </div>

      <button className="btn-primary" onClick={() => navigate('plans')}>
        View Plans & Get Covered →
      </button>
    </div>
  );
}
