import React, { useState } from 'react';

const BACKEND = 'http://localhost:5000';

export default function AutopaySimulator({ navigate, worker, policy, setPolicy }) {
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);

  const steps = [
    { action: 'Pull verified earnings from Zepto API', icon: '📡' },
    { action: 'Recalculate dynamic coverage (40% of earnings)', icon: '🧮' },
    { action: 'Recalculate adjusted premium (zone × rating × season)', icon: '🤖' },
    { action: 'Charge UPI via Razorpay standing mandate', icon: '💳' },
    { action: 'Update policy for coming week', icon: '📋' },
    { action: 'Send confirmation SMS to worker', icon: '📱' },
  ];

  const runAutopay = async () => {
    setRunning(true);
    setDone(false);
    setResults([]);
    setActiveStep(-1);

    try {
      const res = await fetch(`${BACKEND}/api/autopay/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: worker?.workerId || 'ZPT001' })
      });
      const data = await res.json();

      for (let i = 0; i < data.steps.length; i++) {
        setActiveStep(i);
        await new Promise(r => setTimeout(r, 700));
        setResults(prev => [...prev, data.steps[i]]);
      }

      if (setPolicy && policy) {
        setPolicy({ ...policy, weeklyPremium: data.newPremium, coverage: Math.round(data.newCoverage / 7) });
      }
    } catch {
      // Fallback mock
      const mockResults = [
        { result: `₹${worker?.lastWeekEarnings || 6500} verified` },
        { result: `₹${Math.round((worker?.lastWeekEarnings || 6500) * 0.4)} coverage` },
        { result: `₹65/week` },
        { result: `₹65 charged to ${worker?.upiId || 'raju.kumar@upi'}` },
        { result: 'Policy renewed ✓' },
        { result: `"You're covered this week. ₹2,600 coverage active."` },
      ];
      for (let i = 0; i < mockResults.length; i++) {
        setActiveStep(i);
        await new Promise(r => setTimeout(r, 700));
        setResults(prev => [...prev, mockResults[i]]);
      }
    }

    setActiveStep(-1);
    setDone(true);
    setRunning(false);
  };

  return (
    <div className="page">
      <div className="header">
        <div className="logo">GigShield</div>
        <button className="back-btn" onClick={() => navigate('dashboard')}>← Back</button>
      </div>

      <div className="title">Sunday <span className="teal">Autopay Loop</span></div>
      <div className="subtitle">Every Sunday night — zero worker involvement. Raju wakes up Monday already covered.</div>

      <div className="card-teal" style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🌙</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Sunday 11:59 PM</div>
        <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>Batch job runs automatically across all active policies</div>
        <div style={{ fontSize: 13, color: '#999' }}>Worker does nothing. Wakes up covered. ✓</div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        {steps.map((step, i) => {
          const isActive = activeStep === i;
          const isDone = results[i];
          return (
            <div key={i} className={`autopay-step ${isDone || isActive ? 'active' : ''}`}>
              <div className="step-num" style={{ background: isDone ? '#22C55E' : isActive ? '#F59E0B' : '#333' }}>
                {isDone ? '✓' : isActive ? '⟳' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div className="step-action">{step.icon} {step.action}</div>
                {isDone && <div className="step-result">{results[i]?.result}</div>}
                {isActive && !isDone && <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 2 }}>Processing...</div>}
              </div>
            </div>
          );
        })}
      </div>

      {done && (
        <div className="card-teal" style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#22C55E' }}>Autopay Complete!</div>
          <div style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
            {worker?.name || 'Raju'} wakes up Monday morning already covered.
          </div>
          <div style={{ fontSize: 13, color: '#999' }}>They did nothing.</div>
          <div style={{ marginTop: 12, padding: 12, background: '#052e16', borderRadius: 8, fontSize: 13, color: '#22C55E' }}>
            📱 SMS sent: "You're covered this week. ₹2,600 coverage active."
          </div>
        </div>
      )}

      <button className="btn-primary" onClick={runAutopay} disabled={running}>
        {running ? 'Running autopay loop...' : done ? '🔄 Run Again' : '▶ Run Sunday Autopay Loop'}
      </button>
      <button className="btn-secondary" onClick={() => navigate('claims')}>
        View Claim Simulator
      </button>
    </div>
  );
}
