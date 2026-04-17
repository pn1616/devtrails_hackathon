import React, { useState, useEffect } from 'react';
import { useNavigate as useRouterNav } from 'react-router-dom';
import { io } from 'socket.io-client';
import WeatherAlertBanner from '../WeatherAlertBanner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BACKEND = 'http://localhost:5000';

const EMPTY_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Dashboard({ navigate, worker, policy }) {
  const routerNav = useRouterNav();
  const [dashboardData, setDashboardData] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const coverage = dashboardData?.policy?.coverage;
  const weeklyMax = (dashboardData?.policy?.planType || policy?.planType) === 'Basic' ? 1000 : (dashboardData?.policy?.planType || policy?.planType) === 'Elite' ? 3500 : 2000;
  const earnings = dashboardData?.worker?.lastWeekEarnings;
  const dynamicCoverage = dashboardData?.kpis?.weeklyCoverage;

  const totalEarnings = dashboardData?.kpis?.totalEarnings;
  const todayEarnings = dashboardData?.kpis?.todayEarnings;
  const coverageActive = dashboardData?.kpis?.coverageActive;
  const loyaltyMonths = 3;
  const totalMonths = 6;

  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedToday, setAnimatedToday] = useState(0);
  const [showAlertDetail, setShowAlertDetail] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [weeklyLabels, setWeeklyLabels] = useState(EMPTY_WEEK);
  const [weeklyEarnings, setWeeklyEarnings] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [coverageSeries, setCoverageSeries] = useState([0, 0, 0, 0, 0, 0, 0]);

  /* Count-up animation on mount */
  useEffect(() => {
  if (data) {
    const timer = setTimeout(() => {
      setData(null);
    }, 4000);
    return () => clearTimeout(timer);
  }
}, [data]);

  useEffect(() => {
    const dur = 1200;
    const fps = 60;
    const steps = Math.round((dur / 1000) * fps);
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedTotal(Math.round((totalEarnings || 0) * ease));
      setAnimatedToday(Math.round((todayEarnings || 0) * ease));
      if (frame >= steps) clearInterval(timer);
    }, 1000 / fps);
    return () => clearInterval(timer);
  }, [totalEarnings, todayEarnings]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const workerId = worker?.workerId || 'ZPT001';
        const response = await fetch(`${BACKEND}/api/dashboard/worker/${workerId}`);
        const payload = await response.json();
        setLoadFailed(false);
        setDashboardData(payload);
        setAlerts(payload.alerts || []);
        setPayoutHistory(payload.payoutHistory || []);
        setWeeklyLabels(payload.charts?.weeklyLabels || EMPTY_WEEK);
        setWeeklyEarnings(payload.charts?.earningsSeries || [0, 0, 0, 0, 0, 0, 0]);
        setCoverageSeries(payload.charts?.coverageSeries || [0, 0, 0, 0, 0, 0, 0]);
      } catch {
        setLoadFailed(true);
      }
    };
    loadDashboard();

    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socket.on('WEATHER_ALERT', (event) => {
      setAlerts((prev) => [
        {
          id: Date.now(),
          type: 'warning',
          icon: '🌧️',
          title: `Weather Alert — ${event.zone}`,
          desc: `Rainfall ${event.rainfall_mm}mm detected. Claims triggered: ${event.claims || 0}`,
          time: 'Just now',
        },
        ...prev,
      ]);
    });
    return () => socket.disconnect();
  }, []);

  /* Chart configs */
  const barData = {
    labels: weeklyLabels,
    datasets: [
      {
        label: 'Earnings (₹)',
        data: weeklyEarnings,
        backgroundColor: weeklyEarnings.map((v) =>
          v === Math.max(...weeklyEarnings) ? '#00A896' : 'rgba(0,168,150,0.35)'
        ),
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111',
        borderColor: '#00A896',
        borderWidth: 1,
        titleColor: '#999',
        bodyColor: '#fff',
        callbacks: { label: (ctx) => ` ₹${ctx.raw.toLocaleString()}` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#666', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#666', font: { size: 11 }, callback: (v) => `₹${v}` },
        border: { display: false },
      },
    },
  };

  const lineData = {
    labels: weeklyLabels,
    datasets: [
      {
        label: 'Coverage (₹)',
        data: coverageSeries,
        borderColor: '#00A896',
        backgroundColor: 'rgba(0,168,150,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00A896',
        pointRadius: 4,
      },
    ],
  };

  const lineOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        ticks: { color: '#666', font: { size: 11 }, callback: (v) => `₹${v}` },
      },
    },
  };
const simulateRain = async () => {
  try {
    setLoading(true);

    const res = await fetch(`${BACKEND}/api/trigger/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "rainfall",
        workerId: worker?.workerId || "ZPT001",
      }),
    });

    const result = await res.json();
    console.log("SIMULATION RESULT:", result);

    setData(result);
  } catch (err) {
    console.error("Simulation error:", err);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="dash-layout">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="dash-sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-shield">🛡️</span>
          <span className="sidebar-brand">GigShield</span>
        </div>

        <nav className="sidebar-nav">
          {[
            { icon: '📊', label: 'Dashboard', key: 'dashboard', active: true },
            { icon: '⚡', label: 'Simulate Claim', key: 'claims' },
            { icon: '🔄', label: 'Autopay Loop', key: 'autopay' },
          ].map((item) => (
            <button
              key={item.key}
              id={`nav-${item.key}`}
              className={`sidebar-nav-btn${item.active ? ' active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            id="nav-admin-panel"
            className="sidebar-nav-btn"
            style={{ width: '100%', marginBottom: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
            onClick={() => routerNav('/admin')}
          >
            <span className="nav-icon">🔐</span>
            <span className="nav-label">Admin Panel</span>
          </button>
          <div className="sidebar-worker-mini">
            <div className="avatar-sm">{worker?.name?.[0] || 'R'}</div>
            <div>
              <div className="worker-mini-name">{worker?.name || 'Raju Kumar'}</div>
              <div className="worker-mini-sub">{worker?.platform || 'Zepto'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────── */}
      <main className="dash-main">

        {/* Top Bar */}
        <div className="dash-topbar">
          <div>
            <div className="dash-greeting">Welcome back, {worker?.name?.split(' ')[0] || 'Raju'} 👋</div>
            <div className="dash-subtext">{worker?.platform || 'Zepto'} · {worker?.zone || 'Pune'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

  <button
    onClick={simulateRain}
    style={{
      background: '#00A896',
      color: 'white',
      padding: '6px 14px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none'
    }}
  >
    {loading ? "Simulating..." : "🌧️ Simulate Rain"}
  </button>

  <span className={`badge ${coverageActive ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 13 }}>
    {coverageActive ? '● Active Coverage' : '○ Inactive'}
  </span>

  <button
    onClick={() => routerNav('/admin')}
    style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.25)',
      color: '#EF4444',
      padding: '5px 14px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer'
    }}
  >
    🔐 Admin
  </button>

</div>
{/* 🚨 SIMULATION ALERT */}
{data && (
  <div style={{
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#ff4d4f",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    zIndex: 999
  }}>
    ⚠️ Heavy rainfall detected (simulated)
  </div>
)}

{/* 🚀 CLAIM PIPELINE */}
{data && (
  <div style={{
    background: "#111",
    border: "1px solid #333",
    padding: "20px",
    borderRadius: "12px",
    margin: "30px auto",
    maxWidth: "500px"
  }}>

    <h3 style={{ marginBottom: "12px" }}>🚀 Claim Processing</h3>

    <p><b>Claim ID:</b> {data.claim.claimId}</p>
    <p><b>Trigger:</b> {data.claim.triggerName}</p>

    <p>
      <b>Status:</b>{" "}
      <span style={{ color: "#22C55E", fontWeight: 600 }}>
        ✅ Approved
      </span>
    </p>

    <div style={{ marginTop: "12px" }}>
      <p><b>Fraud Score:</b> 0.12</p>
      <p>
        <b>Fraud Status:</b>{" "}
        <span style={{ color: "#22C55E", fontWeight: 600 }}>
          ✅ Low Risk
        </span>
      </p>
      <p style={{ color: "#aaa", fontSize: "12px" }}>
        AI Confidence: 88% · Pattern Verified
      </p>
    </div>

    <div style={{
      background: "#0f2f1f",
      padding: "12px",
      borderRadius: "8px",
      marginTop: "14px"
    }}>
      ✔ Payment Successful (Test Mode)
      <p><b>Amount:</b> ₹{data.payout.amount}</p>
      <p><b>Transaction:</b> {data.payout.transaction_id}</p>
    </div>

    <div style={{
      background: "#1a1a1a",
      padding: "12px",
      borderRadius: "8px",
      marginTop: "14px"
    }}>
      <p><b>Receipt:</b> {data.receipt.receipt_id}</p>
      <p><b>Time:</b> {data.receipt.timestamp}</p>

      <button
        onClick={() =>
          window.open(`${BACKEND}/api/receipt/${data.claim.claimId}`)
        }
        style={{
          marginTop: "8px",
          padding: "6px 12px",
          background: "#00A896",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Download Receipt
      </button>
    </div>

  </div>
)}
        </div>
        {alerts.length > 0 && alerts[0].type === 'warning' && (
          <WeatherAlertBanner
            message={`⚠️ ${alerts[0].title}`}
            subtext={alerts[0].desc}
          />
        )}
        {loadFailed && (
          <div className="card" style={{ marginBottom: 16, border: '1px solid #EF4444', color: '#EF4444', fontWeight: 600 }}>
            Data unavailable
          </div>
        )}

        {/* ── KPI Cards Row ── */}
        <div className="kpi-row">
          {/* Total Earnings */}
          <div className="kpi-card kpi-teal" id="kpi-total-earnings">
            <div className="kpi-icon">💰</div>
            <div className="kpi-body">
              <div className="kpi-label">Total Earnings</div>
              <div className="kpi-value">{dashboardData ? `₹${animatedTotal.toLocaleString()}` : 'Data unavailable'}</div>
              <div className="kpi-trend up">↑ 12% vs last month</div>
            </div>
          </div>

          {/* Today's Earnings */}
          <div className="kpi-card kpi-purple" id="kpi-today-earnings">
            <div className="kpi-icon">📅</div>
            <div className="kpi-body">
              <div className="kpi-label">Today's Earnings</div>
              <div className="kpi-value">{dashboardData ? `₹${animatedToday.toLocaleString()}` : 'Data unavailable'}</div>
              <div className="kpi-trend up">↑ 8% vs yesterday</div>
            </div>
          </div>

          {/* Coverage Status */}
          <div className={`kpi-card ${coverageActive ? 'kpi-green' : 'kpi-red'}`} id="kpi-coverage">
            <div className="kpi-icon">🛡️</div>
            <div className="kpi-body">
              <div className="kpi-label">Coverage Status</div>
              <div className="kpi-value" style={{ fontSize: 22, color: coverageActive ? '#22C55E' : '#EF4444' }}>
                {dashboardData ? (coverageActive ? 'Active' : 'Inactive') : 'Data unavailable'}
              </div>
              <div className="kpi-trend" style={{ color: '#888' }}>{dashboardData ? `₹${dynamicCoverage.toLocaleString()} this week · ${dashboardData?.policy?.planType || policy?.planType || 'Pro'} Plan` : 'Data unavailable'}</div>
            </div>
          </div>

          {/* Payouts Received */}
          <div className="kpi-card kpi-amber" id="kpi-payouts">
            <div className="kpi-icon">📤</div>
            <div className="kpi-body">
              <div className="kpi-label">Payouts Received</div>
              <div className="kpi-value">{dashboardData ? `₹${(dashboardData?.kpis?.payoutsReceived || 0).toLocaleString()}` : 'Data unavailable'}</div>
              <div className="kpi-trend up">{dashboardData ? `${payoutHistory.length} claims paid out` : 'Data unavailable'}</div>
            </div>
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="charts-row">
          {/* Weekly Earnings Bar Chart */}
          <div className="chart-card" id="chart-weekly-earnings">
            <div className="chart-header">
              <div className="chart-title">📈 Weekly Earnings Breakdown</div>
              <span className="badge badge-teal" style={{ fontSize: 11 }}>This Week</span>
            </div>
            <div style={{ height: 200 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Coverage Line Chart */}
          <div className="chart-card" id="chart-coverage-trend">
            <div className="chart-header">
              <div className="chart-title">🛡️ Dynamic Coverage Trend</div>
              <span className="badge badge-teal" style={{ fontSize: 11 }}>40% of earnings</span>
            </div>
            <div style={{ height: 200 }}>
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        </div>

        {/* ── Alerts + Payout Row ── */}
        <div className="bottom-row">
          {/* Alerts Section */}
          <div className="alerts-card" id="section-alerts">
            <div className="section-header">
              <div className="section-title">🔔 Alerts</div>
              <span className="badge badge-amber" style={{ fontSize: 11 }}>{alerts.length} Active</span>
            </div>

            <div className="alerts-list">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  id={`alert-${alert.id}`}
                  className={`alert-item alert-${alert.type}`}
                  onClick={() => setShowAlertDetail(showAlertDetail === alert.id ? null : alert.id)}
                >
                  <div className="alert-icon-wrap">{alert.icon}</div>
                  <div className="alert-body">
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-time">{alert.time}</div>
                    {showAlertDetail === alert.id && (
                      <div className="alert-desc">{alert.desc}</div>
                    )}
                  </div>
                  <div className="alert-chevron">{showAlertDetail === alert.id ? '▲' : '▼'}</div>
                </div>
              ))}
            </div>

            {/* Loyalty Milestone */}
            <div className="loyalty-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>🏆 Loyalty Milestone</div>
                <div style={{ fontSize: 12, color: '#00A896' }}>{loyaltyMonths}/{totalMonths} months</div>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                {totalMonths - loyaltyMonths} more clean months → 20% premium discount
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(loyaltyMonths / totalMonths) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Payout History */}
          <div className="payout-card" id="section-payout-history">
            <div className="section-header">
              <div className="section-title">📋 Payout History</div>
              <span className="badge badge-green" style={{ fontSize: 11 }}>All Paid</span>
            </div>

            <div className="payout-list">
              {payoutHistory.map((p, i) => (
                <div key={i} className="payout-row" id={`payout-${i}`}>
                  <div className="payout-icon">{p.icon}</div>
                  <div className="payout-details">
                    <div className="payout-trigger">{p.trigger}</div>
                    <div className="payout-date">{p.date}</div>
                  </div>
                  <div className="payout-right">
                    <div className="payout-amount">+₹{p.amount}</div>
                    <div className="payout-status">✓ paid</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="payout-total-row">
              <div style={{ fontSize: 13, color: '#999' }}>{dashboardData ? 'Total paid out' : 'Data unavailable'}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#22C55E' }}>
                {dashboardData ? `₹${payoutHistory.reduce((s, p) => s + p.amount, 0).toLocaleString()}` : '—'}
              </div>
            </div>

            <button
              id="btn-simulate-claim"
              className="btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate('claims')}
            >
              🌧️ Simulate Disruption (Rainstorm)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
