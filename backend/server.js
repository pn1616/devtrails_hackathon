const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let policies = {};
let claims = [];

const workers = {
  "ZPT001": {
    workerId: "ZPT001",
    name: "Raju Kumar",
    platform: "Zepto",
    zone: "Kothrud, Pune",
    pinCode: "411038",
    lastWeekEarnings: 6500,
    avgMonthlyEarnings: 24000,
    rating: 4.6,
    tenure: 8,
    upiId: "raju.kumar@upi",
    shiftHours: "morning",
    zoneRisk: 1.2
  },
  "ZPT002": {
    workerId: "ZPT002",
    name: "Priya Sharma",
    platform: "Blinkit",
    zone: "Andheri West, Mumbai",
    pinCode: "400053",
    lastWeekEarnings: 8200,
    avgMonthlyEarnings: 30000,
    rating: 4.8,
    tenure: 14,
    upiId: "priya.sharma@upi",
    shiftHours: "evening",
    zoneRisk: 0.9
  },
  "ZPT003": {
    workerId: "ZPT003",
    name: "Amit Verma",
    platform: "Swiggy Instamart",
    zone: "Koramangala, Bangalore",
    pinCode: "560034",
    lastWeekEarnings: 5800,
    avgMonthlyEarnings: 21000,
    rating: 3.8,
    tenure: 3,
    upiId: "amit.verma@upi",
    shiftHours: "night",
    zoneRisk: 1.0
  }
};

app.get('/api/zepto/worker/:id', (req, res) => {
  const worker = workers[req.params.id];
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  setTimeout(() => res.json({ success: true, worker }), 1500); // simulate OAuth delay
});

app.post('/api/policy/create', (req, res) => {
  const { workerId, planType, weeklyPremium, coverage } = req.body;
  const policy = {
    policyId: `GS-${Date.now()}`,
    workerId,
    planType,
    weeklyPremium,
    coverage,
    status: 'active',
    startDate: new Date().toISOString(),
    renewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    payoutsThisMonth: 0,
    totalProtected: coverage * 4
  };
  policies[workerId] = policy;
  res.json({ success: true, policy });
});

app.get('/api/policy/:workerId', (req, res) => {
  const policy = policies[req.params.workerId];
  if (!policy) return res.status(404).json({ error: 'No active policy' });
  res.json({ success: true, policy });
});

app.put('/api/policy/cancel', (req, res) => {
  const { workerId } = req.body;
  if (policies[workerId]) {
    policies[workerId].status = 'cancelled';
    res.json({ success: true, message: 'Policy cancelled' });
  } else {
    res.status(404).json({ error: 'Policy not found' });
  }
});

app.post('/api/trigger/simulate', (req, res) => {
  const { type, workerId } = req.body;

  const triggers = {
    rainfall:  { name: 'Extreme Rainfall', threshold: '>50mm/hr', payoutPct: 100, color: '#3B82F6' },
    heat:      { name: 'Extreme Heat',     threshold: '>42°C',    payoutPct: 70,  color: '#F97316' },
    aqi:       { name: 'Severe AQI',       threshold: '>300 AQI', payoutPct: 60,  color: '#8B5CF6' },
    curfew:    { name: 'Civil Disruption', threshold: 'Zone alert',payoutPct: 100, color: '#EF4444' },
    outage:    { name: 'Platform Outage',  threshold: '>45 min',  payoutPct: 80,  color: '#6B7280' }
  };

  const trigger = triggers[type];
  if (!trigger) return res.status(400).json({ error: 'Invalid trigger type' });

  const policy = policies[workerId];
  if (!policy) return res.status(404).json({ error: 'No active policy for worker' });

  const dailyCoverage = policy.coverage;
  const payoutAmount = Math.round(dailyCoverage * trigger.payoutPct / 100);

  const claim = {
    claimId: `CLM-${Date.now()}`,
    workerId,
    triggerType: type,
    triggerName: trigger.name,
    threshold: trigger.threshold,
    payoutPct: trigger.payoutPct,
    payoutAmount,
    status: 'processing',
    createdAt: new Date().toISOString(),
    timeline: [
      { stage: 'Trigger Detection',       time: 'T + 0 sec',    status: 'done'       },
      { stage: 'Cross Verification',      time: 'T + 30 sec',   status: 'done'       },
      { stage: 'Policy & Activity Check', time: 'T + 45 sec',   status: 'done'       },
      { stage: 'ML Fraud Score',          time: 'T + 60 sec',   status: 'processing' },
      { stage: 'Auto Approve',            time: 'T + 90 sec',   status: 'pending'    },
      { stage: 'UPI Payout Sent',         time: 'T + 2-3 min',  status: 'pending'    },
      { stage: 'SMS Notification',        time: 'T + 3 min',    status: 'pending'    }
    ]
  };

  claims.push(claim);
  res.json({ success: true, claim });
});

app.get('/api/claims/:workerId', (req, res) => {
  const workerClaims = claims.filter(c => c.workerId === req.params.workerId);
  res.json({ success: true, claims: workerClaims });
});

app.put('/api/claim/approve', (req, res) => {
  const { claimId, fraudScore, fraudTier } = req.body;
  const claim = claims.find(c => c.claimId === claimId);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  claim.status = fraudTier === 'red' ? 'held' : 'approved';
  claim.fraudScore = fraudScore;
  claim.fraudTier = fraudTier;
  claim.approvedAt = new Date().toISOString();
  if (fraudTier !== 'red') {
    claim.upiTransactionId = `UPI${Date.now()}`;
  }
  res.json({ success: true, claim });
});

app.post('/api/autopay/simulate', (req, res) => {
  const { workerId } = req.body;
  const worker = workers[workerId];
  const policy = policies[workerId];
  if (!worker || !policy) return res.status(404).json({ error: 'Worker or policy not found' });

  const verifiedEarnings = worker.lastWeekEarnings;
  const dynamicCoverage = Math.min(policy.coverage * 7, verifiedEarnings * 0.4);
  const baseRate = policy.planType === 'Basic' ? 29 : policy.planType === 'Pro' ? 59 : 99;
  const adjustedPremium = Math.round(baseRate * worker.zoneRisk * (worker.rating >= 4.5 ? 0.9 : 1) * (worker.tenure >= 12 ? 0.85 : 1));

  const steps = [
    { step: 1, action: 'Pull verified earnings from Zepto API',             result: `₹${verifiedEarnings} verified` },
    { step: 2, action: 'Recalculate dynamic coverage (40% of earnings)',     result: `₹${Math.round(verifiedEarnings * 0.4)} coverage` },
    { step: 3, action: 'Recalculate adjusted premium',                       result: `₹${adjustedPremium}/week` },
    { step: 4, action: 'Charge UPI via Razorpay standing mandate',           result: `₹${adjustedPremium} charged to ${worker.upiId}` },
    { step: 5, action: 'Update policy for coming week',                      result: 'Policy renewed ✓' },
    { step: 6, action: 'Send confirmation SMS',                              result: `"You're covered this week. ₹${dynamicCoverage} coverage active."` }
  ];

  policy.weeklyPremium = adjustedPremium;
  policy.coverage = Math.round(dynamicCoverage / 7);
  policy.renewalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  res.json({ success: true, message: 'Autopay loop completed', steps, newCoverage: dynamicCoverage, newPremium: adjustedPremium });
});

app.listen(5000, () => console.log('GigShield backend running on http://localhost:5000'));
