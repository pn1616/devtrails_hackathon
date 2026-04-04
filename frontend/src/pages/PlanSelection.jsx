import React, { useState } from 'react';

const BACKEND = 'http://localhost:5000';
const ML = 'http://localhost:8000';

const PLANS = [
  { type: 'Basic', price: 29, dailyCoverage: 250, maxWeekly: 1000, eligibility: 'New workers', color: '#6B7280' },
  { type: 'Pro', price: 59, dailyCoverage: 450, maxWeekly: 2000, eligibility: '6m+ · 3.5★+', color: '#00A896', popular: true },
  { type: 'Elite', price: 99, dailyCoverage: 750, maxWeekly: 3500, eligibility: '1yr+ · 4.5★+', color: '#8B5CF6' },
];

export default function PlanSelection({ navigate, worker, setPolicy }) {
  const [selected, setSelected] = useState('Pro');
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const fetchPremium = async (planType) => {
    try {
      const res = await fetch(`${ML}/ml/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: planType,
          zone_risk: worker?.zoneRisk || 1.2,
          rating: worker?.rating || 4.6,
          tenure_months: worker?.tenure || 8,
          season: 'monsoon',
          claim_history: 0,
          shift: worker?.shiftHours || 'morning'
        })
      });
      const data = await res.json();
      setPremium(data);
    } catch {
      const bases = { Basic: 29, Pro: 59, Elite: 99 };
      const base = bases[planType];
      const adj = Math.round(base * 1.2 * 0.9 * 0.92 * 1.15);
      const earnings = worker?.lastWeekEarnings || 6500;
      const maxPayout = { Basic: 1000, Pro: 2000, Elite: 3500 };
      setPremium({
        base_premium: base,
        adjusted_premium: adj,
        weekly_coverage: Math.min(maxPayout[planType], earnings * 0.4),
        breakdown: { zone_risk: '1.2x', rating: '0.9x', tenure: '0.92x', season: '1.15x' }
      });
    }
  };

  const handleSelect = async (planType) => {
    setSelected(planType);
    setLoading(true);
    await fetchPremium(planType);
    setLoading(false);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const plan = PLANS.find(p => p.type === selected);
      const res = await fetch(`${BACKEND}/api/policy/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker?.workerId || 'ZPT001',
          planType: selected,
          weeklyPremium: premium?.adjusted_premium || plan.price,
          coverage: plan.dailyCoverage
        })
      });
      const data = await res.json();
      setPolicy(data.policy);
    } catch {
      setPolicy({ policyId: `GS-${Date.now()}`, planType: selected, status: 'active', weeklyPremium: premium?.adjusted_premium || 59, coverage: 450 });
    }
    setDone(true);
    setConfirming(false);
    setTimeout(() => navigate('dashboard'), 2000);
  };

  if (done) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <div className="title" style={{ textAlign: 'center' }}>Coverage Active!</div>
      <div style={{ fontSize: 15, color: '#999', textAlign: 'center', marginTop: 8 }}>
        UPI autopay mandate set via Razorpay.<br />
        You're covered from right now.
      </div>
      <div className="card-teal" style={{ marginTop: 24, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#00A896' }}>₹{premium?.weekly_coverage?.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: '#999' }}>weekly coverage active</div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="header">
        <div className="logo">GigShield</div>
        <button className="back-btn" onClick={() => navigate('oauth')}>← Back</button>
      </div>
      <div className="title">Choose your <span className="teal">Shield</span></div>
      <div className="subtitle">Tap a plan to see your personalised AI premium.</div>

      <div className="plan-cards">
        {PLANS.map(plan => (
          <div key={plan.type}
            className={`plan-card ${selected === plan.type ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
            onClick={() => handleSelect(plan.type)}>
            <div className="plan-header">
              <div>
                {plan.popular && <div style={{ fontSize: 10, color: '#00A896', fontWeight: 600, marginBottom: 2 }}>MOST POPULAR</div>}
                <div className="plan-name" style={{ color: plan.color }}>{plan.type} Shield</div>
                <div style={{ fontSize: 12, color: '#666' }}>{plan.eligibility}</div>
              </div>
              <div>
                <div className="plan-price">₹{plan.price}<span>/week</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#999' }}>
              <span>₹{plan.dailyCoverage}/day</span>
              <span>Max ₹{plan.maxWeekly.toLocaleString()}/week</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card-teal" style={{ marginTop: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <div className="spinner" style={{ margin: '0 auto 8px' }}></div>
              <div style={{ fontSize: 13, color: '#999' }}>Calculating your AI premium...</div>
            </div>
          ) : premium ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>Your personalised premium</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#00A896' }}>₹{premium.adjusted_premium}<span style={{ fontSize: 14, color: '#999', fontWeight: 400 }}>/week</span></div>
                  {premium.base_premium !== premium.adjusted_premium && (
                    <div style={{ fontSize: 12, color: '#555', textDecoration: 'line-through' }}>Base: ₹{premium.base_premium}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#999' }}>Weekly coverage</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>₹{premium.weekly_coverage?.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>40% of ₹{worker?.lastWeekEarnings?.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>
                Premium breakdown: base ₹{premium.base_premium} × zone {premium.breakdown?.zone_risk} × rating {premium.breakdown?.rating} × tenure {premium.breakdown?.tenure} × monsoon {premium.breakdown?.season}
              </div>
              <button className="btn-primary" onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Setting up autopay...' : `Confirm & Set UPI Autopay — ₹${premium.adjusted_premium}/week`}
              </button>
              <div style={{ fontSize: 11, color: '#555', textAlign: 'center', marginTop: 8 }}>
                Powered by Razorpay · Auto-renewed every Sunday night
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
