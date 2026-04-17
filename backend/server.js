const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const Razorpay = require("razorpay");
const { Server } = require("socket.io");
const { startWeatherCron } = require("../node-service/cron");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const ROOT_DIR = path.resolve(__dirname, "..");
const STORAGE_DIR = path.join(ROOT_DIR, "backend", "storage");
const STORAGE_FILE = path.join(STORAGE_DIR, "state.json");
const ML_BASE_URL = process.env.ML_BASE_URL || "http://localhost:8000";
const RAZORPAYX_ACCOUNT_NUMBER = process.env.RAZORPAYX_ACCOUNT_NUMBER || "";

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function loadState() {
  if (!fs.existsSync(STORAGE_FILE)) {
    return { policies: {}, claims: [], weatherEvents: [], fraudPredictions: [], payouts: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(STORAGE_FILE, "utf-8"));
  } catch {
    return { policies: {}, claims: [], weatherEvents: [], fraudPredictions: [], payouts: [] };
  }
}

function saveState() {
  fs.writeFileSync(
    STORAGE_FILE,
    JSON.stringify({ policies, claims, weatherEvents, fraudPredictions, payouts }, null, 2),
    "utf-8"
  );
}

const persisted = loadState();
let policies = persisted.policies || {};
let claims = persisted.claims || [];
let weatherEvents = persisted.weatherEvents || [];
let fraudPredictions = persisted.fraudPredictions || [];
let payouts = persisted.payouts || [];

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SeBsUP2gWKnjUE",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "jM73VwvxYdljpmDCKOk28JAI",
});

async function runFraudCheck(claimInput, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${ML_BASE_URL}/predict/fraud`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(claimInput),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`ML API error: ${response.status}`);
    }
    const payload = await response.json();
    const result = {
      fraud_score: Number(payload.fraud_score ?? 0.5),
      is_fraud: Boolean(payload.is_fraud),
      source: "ml_api",
    };
    fraudPredictions.push({ ...result, claimInput, timestamp: new Date().toISOString() });
    return result;
  } catch {
    const fallback = { fraud_score: 0.5, is_fraud: true, source: "fallback" };
    fraudPredictions.push({ ...fallback, claimInput, timestamp: new Date().toISOString() });
    return fallback;
  } finally {
    clearTimeout(timer);
    saveState();
  }
}

async function processPayout(worker, amount, reference) {
  try {
    let transaction;
    if (razorpay.payouts && typeof razorpay.payouts.create === "function" && RAZORPAYX_ACCOUNT_NUMBER) {
      const payout = await razorpay.payouts.create({
        account_number: RAZORPAYX_ACCOUNT_NUMBER,
        amount: Math.round(amount * 100),
        currency: "INR",
        mode: "UPI",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: reference,
        narration: "GigShield claim payout",
        fund_account: {
          account_type: "vpa",
          vpa: { address: worker.upiId },
          contact: {
            name: worker.name,
            email: `${worker.workerId.toLowerCase()}@gigshield.test`,
            contact: "9000000000",
            type: "employee",
          },
        },
      });
      transaction = {
        transaction_id: payout.id,
        amount,
        currency: payout.currency || "INR",
        method: "UPI",
        upi_id: worker.upiId,
        status: payout.status || "processed",
        timestamp: new Date().toISOString(),
      };
    } else {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: reference.slice(0, 40),
        notes: { worker_id: worker.workerId, upi_id: worker.upiId, flow: "claim_payout" },
      });
      transaction = {
        transaction_id: order.id,
        amount,
        currency: order.currency || "INR",
        method: "RAZORPAY_ORDER",
        upi_id: worker.upiId,
        status: "success",
        timestamp: new Date().toISOString(),
      };
    }
    payouts.push(transaction);
    saveState();
    return { status: "success", ...transaction };
  } catch (error) {
    const failed = {
      status: "failed",
      transaction_id: null,
      amount,
      currency: "INR",
      method: "UPI",
      upi_id: worker.upiId,
      timestamp: new Date().toISOString(),
      reason: error?.error?.description || error?.message || "payout_failed",
    };
    payouts.push(failed);
    saveState();
    return failed;
  }
}

function generateReceipt(claim, worker) {
  return {
    receipt_id: `RCPT_${Date.now()}`,
    worker_name: worker.name,
    worker_id: worker.workerId,
    trigger: claim.triggerName,
    amount: claim.payoutAmount,
    transaction_id: claim.transaction?.transaction_id || null,
    timestamp: new Date().toISOString(),
    status: claim.status,
  };
}

function simulateRain(zone = "Mumbai", rainfallMm = 65) {
  const event = {
    event_id: `EVT-${Date.now()}`,
    event: "rainstorm",
    zone,
    rainfall_mm: rainfallMm,
    timestamp: new Date().toISOString(),
  };
  weatherEvents.push(event);
  saveState();
  return event;
}

function createClaims(workerList, triggerType = "rainfall") {
  return workerList.map((worker) => {
    const policy = policies[worker.workerId] || {
      policyId: `GS-auto-${worker.workerId}`,
      workerId: worker.workerId,
      planType: "Pro",
      weeklyPremium: 59,
      coverage: 450,
      status: "active",
      startDate: new Date().toISOString(),
      renewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      payoutsThisMonth: 0,
      totalProtected: 1800,
    };
    policies[worker.workerId] = policy;
    return {
      claimId: `CLM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      workerId: worker.workerId,
      triggerType,
      triggerName: "Extreme Rainfall",
      threshold: ">50mm/hr",
      payoutPct: 100,
      payoutAmount: Math.round(policy.coverage),
      status: "processing",
      flags: {},
      createdAt: new Date().toISOString(),
      timeline: [],
    };
  });
}

function getRecentDays(days = 7) {
  const labels = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    labels.push(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
  }
  return labels;
}

function aggregateClaimsByDay(days = 7) {
  const labels = getRecentDays(days);
  const bucket = Object.fromEntries(labels.map((l) => [l, { total: 0, approved: 0, held: 0 }]));
  claims.forEach((claim) => {
    const label = new Date(claim.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    if (!bucket[label]) return;
    bucket[label].total += 1;
    if (claim.status === "approved") bucket[label].approved += 1;
    if (claim.status === "held") bucket[label].held += 1;
  });
  return {
    labels,
    total: labels.map((l) => bucket[l].total),
    approved: labels.map((l) => bucket[l].approved),
    held: labels.map((l) => bucket[l].held),
  };
}

function computeLossRatio() {
  const payoutAmount = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const premiumAmount = Object.values(policies).reduce((sum, p) => sum + Number(p.weeklyPremium || 0), 0);
  if (!premiumAmount) return 0;
  return Number(((payoutAmount / premiumAmount) * 100).toFixed(2));
}

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
  saveState();
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
    saveState();
    res.json({ success: true, message: 'Policy cancelled' });
  } else {
    res.status(404).json({ error: 'Policy not found' });
  }
});

app.post("/api/trigger/simulate", async (req, res) => {
  const { type, workerId } = req.body;

  const triggers = {
    rainfall:  { name: 'Extreme Rainfall', threshold: '>50mm/hr', payoutPct: 100 },
    heat:      { name: 'Extreme Heat',     threshold: '>42°C',    payoutPct: 70 },
    aqi:       { name: 'Severe AQI',       threshold: '>300 AQI', payoutPct: 60 },
    curfew:    { name: 'Civil Disruption', threshold: 'Zone alert', payoutPct: 100 },
    outage:    { name: 'Platform Outage',  threshold: '>45 min',  payoutPct: 80 }
  };

  const trigger = triggers[type];
  if (!trigger) return res.status(400).json({ error: 'Invalid trigger type' });

  const policy = policies[workerId];
  if (!policy) return res.status(404).json({ error: 'No active policy for worker' });
  const worker = workers[workerId];
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  const dailyCoverage = policy.coverage;
  const payoutAmount = Math.round(dailyCoverage * trigger.payoutPct / 100);
  const payout = await processPayout(worker, payoutAmount, `claim_${worker.workerId}_${Date.now()}`);

  const claim = {
    claimId: `CLM-${Date.now()}`,
    workerId,
    triggerType: type,
    triggerName: trigger.name,
    threshold: trigger.threshold,
    payoutPct: trigger.payoutPct,
    payoutAmount,
    status: payout.status === "success" ? 'approved' : "held",
    approvedAt: new Date().toISOString(),
    transaction: {
      transaction_id: payout.transaction_id,
      amount: payout.amount,
      currency: payout.currency,
      method: payout.method,
      upi_id: payout.upi_id,
      status: payout.status,
      timestamp: payout.timestamp,
    },
    createdAt: new Date().toISOString(),
    timeline: [
      { stage: 'Trigger Detection', time: 'T + 0 sec', status: 'done' },
      { stage: 'Cross Verification', time: 'T + 30 sec', status: 'done' },
      { stage: 'Policy Check', time: 'T + 45 sec', status: 'done' },
      { stage: 'Fraud Check', time: 'T + 60 sec', status: 'done' },
      { stage: 'Auto Approve', time: 'T + 90 sec', status: 'done' },
      { stage: 'UPI Payout Sent', time: 'T + 2 min', status: 'done' }
    ]
  };

  claims.push(claim);
  saveState();
  const receipt = generateReceipt(claim, worker);

  res.json({
    success: true,
    message: payout.status === "success" ? "Instant payout completed" : "Claim created but payout failed",
    claim,
    payout,
    receipt
  });
});

app.get('/api/claims/:workerId', (req, res) => {
  const workerClaims = claims.filter(c => c.workerId === req.params.workerId);
  res.json({ success: true, claims: workerClaims });
});

app.get('/api/receipt/:claimId', (req, res) => {
  const claim = claims.find(c => c.claimId === req.params.claimId);
  if (!claim) return res.status(404).send("Not found");

  const worker = workers[claim.workerId];
  if (!worker) return res.status(404).send("Worker not found");
  if (!claim.transaction) return res.status(400).send("No payout transaction found");

  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=receipt.pdf");

  doc.pipe(res);
  doc.fontSize(20).text("GigShield Receipt", { align: "center" });
  doc.moveDown();
  doc.text(`Worker: ${worker.name}`);
  doc.text(`Amount: Rs ${claim.payoutAmount}`);
  doc.text(`Transaction ID: ${claim.transaction.transaction_id}`);
  doc.text(`Timestamp: ${claim.transaction.timestamp}`);
  doc.end();
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
  saveState();
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
  saveState();

  res.json({ success: true, message: 'Autopay loop completed', steps, newCoverage: dynamicCoverage, newPremium: adjustedPremium });
});

app.get("/api/model/metrics", async (_req, res) => {
  try {
    const response = await fetch(`${ML_BASE_URL}/model/metrics`);
    if (!response.ok) throw new Error("metrics_error");
    return res.json(await response.json());
  } catch {
    return res.status(200).json({
      fraud_model: { accuracy: 0, precision: 0, recall: 0, confusion_matrix: [[0, 0], [0, 0]] },
      premium_model: { r2_score: 0, mae: 0 },
    });
  }
});

app.post("/api/ring/detect", async (req, res) => {
  try {
    const response = await fetch(`${ML_BASE_URL}/detect/ring`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claims: req.body?.claims || [] }),
    });
    if (!response.ok) {
      throw new Error(`ring_api_error_${response.status}`);
    }
    return res.json(await response.json());
  } catch {
    return res.json({ risk_score: 0, cluster_members: [] });
  }
});

app.post("/simulate/rainstorm", async (req, res) => {
  try {
    const zone = req.body?.zone || "Mumbai";
    const rainfallMm = Number(req.body?.rainfall_mm ?? 65);
    const event = simulateRain(zone, rainfallMm);
    const workersInZone = Object.values(workers).filter((worker) => worker.zone.toLowerCase().includes(zone.toLowerCase()));
    const selectedWorkers = workersInZone.length > 0 ? workersInZone : [workers.ZPT001];
    const createdClaims = createClaims(selectedWorkers, "rainfall");
    const finalizedClaims = [];

    for (const claim of createdClaims) {
      const worker = workers[claim.workerId];
      const fraudResult = await runFraudCheck({
        claim_amount: claim.payoutAmount,
        location_consistency: 0.85,
        weather_correlation: rainfallMm > 0 ? 0.92 : 0.1,
        claim_frequency: 0.9,
        time_anomalies: 0.12,
      });
      const weatherMismatch = rainfallMm <= 0;
      claim.flags = { weather_mismatch: weatherMismatch };
      claim.fraudScore = fraudResult.fraud_score;
      claim.isFraud = fraudResult.is_fraud || weatherMismatch;
      claim.status = claim.isFraud ? "held" : "approved";

      let payout = { status: "skipped", transaction_id: null, amount: claim.payoutAmount };
      if (!claim.isFraud) {
        payout = await processPayout(worker, claim.payoutAmount, `rainstorm_${claim.claimId}`);
      }

      claim.transaction = {
        transaction_id: payout.transaction_id,
        amount: payout.amount,
        status: payout.status,
        timestamp: payout.timestamp || new Date().toISOString(),
      };
      claim.status = claim.status === "approved" && payout.status !== "success" ? "held" : claim.status;
      const receipt = generateReceipt(claim, worker);
      claims.push(claim);
      finalizedClaims.push({
        claim_id: claim.claimId,
        worker_id: claim.workerId,
        fraud_score: claim.fraudScore,
        is_fraud: claim.isFraud,
        flags: claim.flags,
        status: claim.status,
        payout: {
          status: payout.status,
          transaction_id: payout.transaction_id,
          amount: payout.amount,
          reason: payout.reason,
        },
        receipt: {
          id: receipt.receipt_id,
          timestamp: receipt.timestamp,
          amount: receipt.amount,
          transaction_id: receipt.transaction_id,
        },
      });
    }

    saveState();
    io.emit("WEATHER_ALERT", {
      event: event.event,
      zone: event.zone,
      rainfall_mm: event.rainfall_mm,
      claims: finalizedClaims.length,
      timestamp: event.timestamp,
    });

    return res.json({
      event: "rainstorm",
      zone,
      claims: finalizedClaims,
    });
  } catch (error) {
    return res.status(500).json({ error: "simulation_failed", message: error.message });
  }
});

app.get("/api/storage/state", (_req, res) => {
  res.json({ policies, claims, weatherEvents, fraudPredictions, payouts });
});

app.get("/api/dashboard/worker/:workerId", (req, res) => {
  const workerId = req.params.workerId;
  const worker = workers[workerId] || workers.ZPT001;
  const policy = policies[workerId] || {
    planType: "Pro",
    coverage: 450,
  };
  const workerClaims = claims.filter((c) => c.workerId === worker.workerId);
  const payoutHistory = workerClaims
    .filter((c) => c.status === "approved")
    .slice(-10)
    .reverse()
    .map((c) => ({
      date: new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      trigger: c.triggerName,
      amount: Number(c.payoutAmount || 0),
      status: c.status,
      icon: c.triggerType === "rainfall" ? "🌧️" : "✅",
      claimId: c.claimId,
    }));

  const alerts = weatherEvents.slice(-5).reverse().map((w, idx) => ({
    id: idx + 1,
    type: w.rainfall_mm > 50 ? "warning" : "success",
    icon: w.rainfall_mm > 50 ? "🌧️" : "✅",
    title: `${w.event.replace("_", " ").toUpperCase()} — ${w.zone}`,
    desc: `Rainfall ${w.rainfall_mm}mm (${w.source || "system"})`,
    time: new Date(w.timestamp).toLocaleTimeString("en-IN"),
  }));

  const weeklyLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyBase = Math.round((worker.lastWeekEarnings || 6500) / 7);
  const earningsSeries = weeklyLabels.map((_, i) => dailyBase + (i % 2 === 0 ? 60 : -40));

  return res.json({
    worker,
    policy,
    kpis: {
      totalEarnings: Number(worker.avgMonthlyEarnings || 24000) * 2,
      todayEarnings: dailyBase,
      coverageActive: policy.status !== "cancelled",
      weeklyCoverage: Number(policy.coverage || 450) * 7,
      payoutsReceived: payoutHistory.reduce((sum, p) => sum + p.amount, 0),
    },
    charts: {
      weeklyLabels,
      earningsSeries,
      coverageSeries: earningsSeries.map((v) => Math.round(v * 0.4)),
    },
    alerts,
    payoutHistory,
  });
});

app.get("/api/dashboard/admin", async (_req, res) => {
  const trends = aggregateClaimsByDay(7);
  let metrics = {
    fraud_model: { accuracy: 0, precision: 0, recall: 0 },
    premium_model: { r2_score: 0, mae: 0 },
  };
  try {
    const metricsResponse = await fetch(`${ML_BASE_URL}/model/metrics`);
    if (metricsResponse.ok) {
      metrics = await metricsResponse.json();
    }
  } catch {
  }

  const fraudAlerts = claims
    .filter((c) => c.status === "held" || c.isFraud || (c.flags && c.flags.weather_mismatch))
    .slice(-10)
    .reverse()
    .map((c) => {
      const worker = workers[c.workerId] || {};
      return {
        id: c.claimId,
        worker: worker.name || c.workerId,
        platform: `${worker.platform || "Unknown"} · ${worker.zone || "Unknown"}`,
        score: Number(c.fraudScore || 0.5),
        flags: Object.entries(c.flags || {}).filter(([, v]) => v).map(([k]) => k),
        amount: Number(c.payoutAmount || 0),
        time: new Date(c.createdAt).toLocaleTimeString("en-IN"),
        status: c.status === "held" ? "blocked" : "review",
      };
    });

  const platformsMap = {};
  claims.forEach((c) => {
    const worker = workers[c.workerId];
    if (!worker) return;
    const name = worker.platform || "Unknown";
    if (!platformsMap[name]) platformsMap[name] = { name, claims: 0, payout: 0, fraud: 0 };
    platformsMap[name].claims += 1;
    platformsMap[name].payout += Number(c.payoutAmount || 0);
    if (c.status === "held") platformsMap[name].fraud += 1;
  });
  const topPlatforms = Object.values(platformsMap);

  const labels = getRecentDays(7);
  const predictedClaims = labels.map((_, i) => Math.max(0, Math.round((trends.total[i] || 0) * 0.9 + 4)));
  const predictedRisk = labels.map((_, i) => Number((0.1 + (trends.held[i] || 0) / Math.max(1, trends.total[i] || 1) * 0.6).toFixed(2)));

  return res.json({
    summary: {
      totalClaims: claims.length,
      fraudBlocked: claims.filter((c) => c.status === "held").length,
      lossRatio: computeLossRatio(),
      modelAccuracy: Number(((metrics?.fraud_model?.accuracy || 0) * 100).toFixed(2)),
    },
    trends: {
      labels: trends.labels,
      total: trends.total,
      approved: trends.approved,
      fraud: trends.held,
    },
    prediction: {
      labels,
      claims: predictedClaims,
      risk: predictedRisk,
    },
    fraudAlerts,
    topPlatforms,
    modelMetrics: {
      accuracy: Number(metrics?.fraud_model?.accuracy || 0),
      precision: Number(metrics?.fraud_model?.precision || 0),
      recall: Number(metrics?.fraud_model?.recall || 0),
      r2_score: Number(metrics?.premium_model?.r2_score || 0),
      mae: Number(metrics?.premium_model?.mae || 0),
    },
  });
});

startWeatherCron({
  io,
  triggerClaims: async (zone, weatherData) => {
    const rainfallMm = Number(weatherData?.rainfall_mm || 0);
    if (rainfallMm <= 50) return;
    const workersInZone = Object.values(workers).filter((worker) => worker.zone.toLowerCase().includes(zone.toLowerCase()));
    const selectedWorkers = workersInZone.length > 0 ? workersInZone : [workers.ZPT001];
    const autoClaims = createClaims(selectedWorkers, "rainfall");
    for (const claim of autoClaims) {
      claim.status = "processing";
      claims.push(claim);
    }
    weatherEvents.push({
      event_id: `EVT-${Date.now()}`,
      event: "rain_alert",
      zone,
      rainfall_mm: rainfallMm,
      source: weatherData?.source || "openweather",
      timestamp: new Date().toISOString(),
    });
    saveState();
  },
});

const PORT = Number(process.env.PORT || 5000);
server.listen(PORT, () => console.log(`GigShield backend running on http://localhost:${PORT}`));
