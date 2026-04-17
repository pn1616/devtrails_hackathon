import React, { useState } from 'react';
import WeatherAlertBanner from '../WeatherAlertBanner';

const BACKEND = 'http://localhost:5000';

const TRIGGERS = [
  { type: 'rainfall', name: 'Heavy Rain', icon: '🌧️', threshold: '>50mm/hr', payout: 100 },
  { type: 'heat',     name: 'Extreme Heat', icon: '🌡️', threshold: '>42°C',    payout: 70  },
  { type: 'aqi',      name: 'Severe AQI',  icon: '💨', threshold: '>300 AQI', payout: 60  },
  { type: 'curfew',   name: 'Curfew',      icon: '🚫', threshold: 'Zone alert',payout: 100 },
  { type: 'outage',   name: 'App Outage',  icon: '📵', threshold: '>45 min',  payout: 80  },
];

const FRAUD_SIGNALS_DEMO = [
  { name: 'GPS Stability',        safe_value: 'Field GPS — normal',    unsafe_value: 'Perfect lock — suspicious', weight: 0.20 },
  { name: 'Accelerometer',        safe_value: 'Bike motion detected',  unsafe_value: 'Static — sitting still',    weight: 0.20 },
  { name: 'Network Type',         safe_value: '4G field signal',       unsafe_value: 'Home WiFi — red flag',      weight: 0.20 },
  { name: 'Order History',        safe_value: 'Active 30 min ago',     unsafe_value: 'No orders for 3 hrs',       weight: 0.15 },
  { name: 'Filing Speed',         safe_value: '47s after trigger',     unsafe_value: '0.8s — instant script',     weight: 0.10 },
  { name: 'Cohort Spike',         safe_value: 'Normal claim volume',   unsafe_value: '34 claims in 5 min!',       weight: 0.10 },
  { name: 'Device Fingerprint',   safe_value: '1 account on device',   unsafe_value: '3 accounts — farm!',        weight: 0.05 },
];

export default function ClaimsPage({ navigate, worker, policy }) {
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [claim, setClaim] = useState(null);
  const [ringResult, setRingResult] = useState(null);
  const [dataUnavailable, setDataUnavailable] = useState(false);
  const [phase, setPhase] = useState('select'); // select | triggered | scoring | result
  const [fraudScore, setFraudScore] = useState(null);
  const [visibleSignals, setVisibleSignals] = useState(0);
  const [isFraud, setIsFraud] = useState(false);
  const [timelineStep, setTimelineStep] = useState(0);

  const handleTrigger = async (trigger) => {
    setSelectedTrigger(trigger);
    setPhase('triggered');
    setDataUnavailable(false);
    setTimelineStep(0);
    setVisibleSignals(0);

    // Simulate timeline
    const steps = [1, 2, 3, 4];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      setTimelineStep(i + 1);
    }

    setPhase('scoring');

    // Animate fraud signals one by one
    for (let i = 0; i <= 7; i++) {
      await new Promise(r => setTimeout(r, 400));
      setVisibleSignals(i);
    }

    try {
      if (trigger.type === 'rainfall') {
        const simResponse = await fetch(`${BACKEND}/simulate/rainstorm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zone: 'Mumbai', rainfall_mm: 65 })
        });
        const simData = await simResponse.json();
        const firstClaim = simData?.claims?.[0];
        const score = firstClaim?.fraud_score ?? 0.18;
        const tier = score >= 0.7 ? 'red' : score >= 0.35 ? 'amber' : 'green';
        setFraudScore({
          score,
          tier,
          tier_color: tier === 'red' ? '#EF4444' : tier === 'amber' ? '#F59E0B' : '#22C55E',
          auto_action: firstClaim?.status === 'approved'
            ? 'AUTO-APPROVE — Payout initiated instantly'
            : 'HOLD FOR REVIEW — Additional verification needed',
          worker_message: firstClaim?.status === 'approved'
            ? `Disruption detected in your zone. Rs ${firstClaim?.payout?.amount || 450} credited to your UPI.`
            : 'Your claim requires additional verification.',
          signals: FRAUD_SIGNALS_DEMO.map((s) => ({
            signal: s.name,
            value: s.safe_value,
            suspicious: false,
            weight: s.weight,
            contribution: 0
          }))
        });
        setClaim({
          claimId: firstClaim?.claim_id,
          payoutAmount: firstClaim?.payout?.amount || 450,
          status: firstClaim?.status,
          payout: firstClaim?.payout,
          receipt: firstClaim?.receipt,
          flags: firstClaim?.flags || {}
        });

        const ringClaims = Array.from({ length: 35 }).map((_, i) => ({
          claim_id: `${firstClaim?.claim_id || 'demo'}-${i}`,
          zone: 'Mumbai',
          timestamp: new Date().toISOString(),
          claim_amount: 12000 + i * 10
        }));
        const ringResponse = await fetch(`${BACKEND}/api/ring/detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claims: ringClaims })
        });
        const ringData = await ringResponse.json();
        setRingResult(ringData);
      } else {
        const res = await fetch(`${BACKEND}/api/trigger/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: trigger.type, workerId: worker?.workerId || 'ZPT001' })
        });
        const data = await res.json();
        setClaim(data.claim);
      }
    } catch {
      setDataUnavailable(true);
      setFraudScore(null);
      setClaim(null);
    }
    await new Promise(r => setTimeout(r, 500));
    setPhase('result');
  };

  const tierColors = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' };
  const tierBadge = { green: 'badge-green', amber: 'badge-amber', red: 'badge-red' };

  if (phase === 'select') return (
    <div className="page">
      <div className="header">
        <div className="logo">GigShield</div>
        <button className="back-btn" onClick={() => navigate('dashboard')}>← Back</button>
      </div>
      <div className="title">Disruption <span className="teal">Simulator</span></div>
      <div className="subtitle">Select a disruption type to see the automated claim and payout flow — with live AI fraud scoring.</div>

      <div className="trigger-grid">
        {TRIGGERS.map(t => (
          <div key={t.type} className="trigger-btn" onClick={() => handleTrigger(t)}>
            <div className="trigger-icon">{t.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{t.name}</div>
            <div className="trigger-name">{t.threshold}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#00A896', fontWeight: 600 }}>{t.payout}% payout</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ fontSize: 13, color: '#666' }}>
        💡 <span style={{ color: '#999' }}>Platform outage is Trigger 5 — unique to GigShield. No other insurance covers app downtime as income loss.</span>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <button style={{ flex: 1, padding: 12, background: '#111', border: '1px solid #333', borderRadius: 12, color: '#999', cursor: 'pointer', fontSize: 13 }} onClick={() => navigate('autopay')}>
          🔄 View Autopay Loop
        </button>
      </div>
    </div>
  );

  if (phase === 'triggered' || phase === 'scoring') return (
    <div className="page">
      <div className="header"><div className="logo">GigShield</div></div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>{selectedTrigger?.icon}</div>
        <div className="title"><span className="teal">{selectedTrigger?.name}</span> detected</div>
        <div className="subtitle">{selectedTrigger?.threshold} · Automatic payout flow initiated</div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 12, fontWeight: 600 }}>PAYOUT TIMELINE</div>
        {[
          { label: 'Trigger Detection',       time: 'T + 0 sec'   },
          { label: 'Cross Verification',      time: 'T + 30 sec'  },
          { label: 'Policy & Activity Check', time: 'T + 45 sec'  },
          { label: 'ML Fraud Score',          time: 'T + 60 sec'  },
        ].map((item, i) => (
          <div key={i} className="timeline-item">
            <div className={`timeline-dot ${i < timelineStep ? 'dot-done' : i === timelineStep ? 'dot-active' : 'dot-pending'}`}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: i < timelineStep ? '#22C55E' : i === timelineStep ? '#F59E0B' : '#555' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#555' }}>{item.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fraud Score Visualizer — THE UNIQUE FEATURE */}
      {phase === 'scoring' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>🤖 AI FRAUD SCORING</div>
            <div style={{ fontSize: 11, color: '#999' }}>7 signals · Real-time</div>
          </div>
          <div className="fraud-signals">
            {FRAUD_SIGNALS_DEMO.map((signal, i) => {
              const visible = i < visibleSignals;
              const suspicious = isFraud && i < 3;
              return (
                <div key={i} className="signal-row" style={{ opacity: visible ? 1 : 0.2, transition: 'opacity 0.4s' }}>
                  <div className="signal-name">{signal.name}</div>
                  <div className="signal-bar-wrap">
                    <div className={`signal-bar ${suspicious ? 'bar-warn' : 'bar-safe'}`}
                      style={{ width: visible ? `${signal.weight * 100}%` : '0%' }}></div>
                  </div>
                  <div className={`signal-status ${suspicious ? 'red' : 'green'}`} style={{ fontSize: 10 }}>
                    {visible ? (suspicious ? '⚠ FLAG' : '✓ OK') : '...'}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 24, fontWeight: 700, color: '#00A896' }}>
            {visibleSignals >= 7 ? 'Score: 0.18 → 🟢 GREEN' : `Analyzing ${visibleSignals}/7 signals...`}
          </div>
        </div>
      )}
    </div>
  );

  // Result phase
  const score = fraudScore?.score || 0;
  const tier = fraudScore?.tier || 'red';
  const tierColor = tierColors[tier];

  return (
    <div className="page">
      <div className="header">
        <div className="logo">GigShield</div>
        <span className={`badge ${tierBadge[tier]}`}>{tier.toUpperCase()}</span>
      </div>
      {selectedTrigger?.type === 'rainfall' && (
        <WeatherAlertBanner
          message="⚠️ Heavy rain detected (simulated)"
          subtext="Claims auto-triggered for 12 workers"
        />
      )}
      {dataUnavailable && (
        <div className="card" style={{ marginBottom: 16, border: '1px solid #EF4444', color: '#EF4444', fontWeight: 600 }}>
          Data unavailable
        </div>
      )}

      <div className="score-circle" style={{ borderColor: tierColor }}>
        <div className="score-number" style={{ color: tierColor }}>{fraudScore ? score.toFixed(2) : '—'}</div>
        <div className="score-label">fraud score</div>
      </div>

      <div className="card-teal" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>Decision</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: tierColor }}>{fraudScore?.auto_action || 'Data unavailable'}</div>
        {tier === 'green' && (
          <div style={{ marginTop: 12, padding: 12, background: '#052e16', borderRadius: 8, fontSize: 13, color: '#22C55E' }}>
            📱 SMS: "{fraudScore?.worker_message}"
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 12, fontWeight: 600 }}>7 FRAUD SIGNALS ANALYZED</div>
        <div className="fraud-signals">
          {(fraudScore?.signals || []).map((s, i) => (
            <div key={i} className="signal-row">
              <div className="signal-name" style={{ fontSize: 11 }}>{s.signal}</div>
              <div className="signal-bar-wrap">
                <div className={`signal-bar ${s.suspicious ? 'bar-warn' : 'bar-safe'}`}
                  style={{ width: `${s.weight * 100}%` }}></div>
              </div>
              <div className={`signal-status ${s.suspicious ? 'red' : 'green'}`} style={{ fontSize: 10 }}>
                {s.suspicious ? '⚠' : '✓'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {tier === 'green' && claim && (
        <div className="card-teal" style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#999' }}>Payout sent to {worker?.upiId || 'raju.kumar@upi'}</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#00A896', margin: '8px 0' }}>₹{claim?.payoutAmount || 450}</div>
          <div style={{ fontSize: 12, color: '#22C55E', marginBottom: 12 }}>✓ Credited in under 3 minutes</div>
          <a
            href={`${BACKEND}/api/receipt/${claim.claimId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ display: 'inline-block', marginTop: 10 }}
          >
            Download Receipt 📄
          </a>
        </div>
      )}
      {claim?.flags?.weather_mismatch && (
        <div className="card" style={{ marginBottom: 16, border: '1px solid #EF4444', color: '#EF4444' }}>
          ⚠ Weather Mismatch
        </div>
      )}

      {ringResult && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8, fontWeight: 600 }}>RING DETECTION</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Risk Score: <span className="teal">{ringResult.risk_score}</span></div>
          <div style={{ fontSize: 12, color: '#666' }}>
            Suspicious cluster members: {ringResult.cluster_members?.length || 0}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 16 }}>
        "{fraudScore?.worker_message}"
        <br />— The word "fraud" is never shown to the worker
      </div>

      <button className="btn-primary" onClick={() => { setPhase('select'); setSelectedTrigger(null); setFraudScore(null); setVisibleSignals(0); }}>
        Simulate Another Trigger
      </button>
      <button className="btn-secondary" onClick={() => navigate('dashboard')}>Back to Dashboard</button>
    </div>
  );
}
