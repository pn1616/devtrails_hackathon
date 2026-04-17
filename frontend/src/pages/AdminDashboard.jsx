import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BACKEND = 'http://localhost:5000';

/* ── Shared chart helpers ──────────────────────────── */
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#666', font: { size: 11 }, boxWidth: 12, padding: 16 },
    },
    tooltip: {
      backgroundColor: '#111',
      borderColor: '#2a2d36',
      borderWidth: 1,
      titleColor: '#999',
      bodyColor: '#fff',
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#555', font: { size: 11 } },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#555', font: { size: 11 } },
      border: { display: false },
    },
  },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [lossRatio, setLossRatio] = useState(0);
  const [modelAccuracy, setModelAccuracy] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);
  const [fraudBlocked, setFraudBlocked] = useState(0);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    precision: 0,
    recall: 0,
    r2_score: 0,
    mae: 0,
  });

  /* animated counters */
  const [animLoss, setAnimLoss]     = useState(0);
  const [animAcc,  setAnimAcc]      = useState(0);
  const [animClaims, setAnimClaims] = useState(0);
  const [animFraud,  setAnimFraud]  = useState(0);

  useEffect(() => {
    const dur = 1200, fps = 60, steps = Math.round((dur / 1000) * fps);
    let frame = 0;
    const t = setInterval(() => {
      frame++;
      const e = 1 - Math.pow(1 - frame / steps, 3);
      setAnimLoss(+(lossRatio * e).toFixed(1));
      setAnimAcc(+(modelAccuracy * e).toFixed(1));
      setAnimClaims(Math.round(totalClaims * e));
      setAnimFraud(Math.round(fraudBlocked * e));
      if (frame >= steps) clearInterval(t);
    }, 1000 / fps);
    return () => clearInterval(t);
  }, [lossRatio, modelAccuracy, totalClaims, fraudBlocked]);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch(`${BACKEND}/api/dashboard/admin`);
        const payload = await response.json();
        setLoadFailed(false);
        setAdminData(payload);
        setTotalClaims(payload?.summary?.totalClaims || 0);
        setFraudBlocked(payload?.summary?.fraudBlocked || 0);
        setLossRatio(payload?.summary?.lossRatio || 0);
        const accuracyPct = Number((payload?.modelMetrics?.accuracy || 0) * 100);
        setModelAccuracy(accuracyPct);
        setModelMetrics({
          accuracy: Number(payload?.modelMetrics?.accuracy || 0),
          precision: Number(payload?.modelMetrics?.precision || 0),
          recall: Number(payload?.modelMetrics?.recall || 0),
          r2_score: Number(payload?.modelMetrics?.r2_score || 0),
          mae: Number(payload?.modelMetrics?.mae || 0),
        });
      } catch {
        setLoadFailed(true);
        setModelAccuracy(0);
        setModelMetrics({
          accuracy: 0,
          precision: 0,
          recall: 0,
          r2_score: 0,
          mae: 0,
        });
      }
    };
    loadMetrics();
  }, []);

  /* Claim Trends chart */
  const claimTrendData = {
    labels: adminData?.trends?.labels || [],
    datasets: [
      {
        label: 'Total Claims',
        data: adminData?.trends?.total || [],
        borderColor: '#00A896',
        backgroundColor: 'rgba(0,168,150,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00A896',
        pointRadius: 4,
      },
      {
        label: 'Approved',
        data: adminData?.trends?.approved || [],
        borderColor: '#22C55E',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointBackgroundColor: '#22C55E',
        pointRadius: 4,
        borderDash: [4, 3],
      },
      {
        label: 'Fraud Blocked',
        data: adminData?.trends?.fraud || [],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239,68,68,0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#EF4444',
        pointRadius: 4,
      },
    ],
  };

  /* 7-Day Prediction chart */
  const predData = {
    labels: adminData?.prediction?.labels || [],
    datasets: [
      {
        label: 'Predicted Claims',
        data: adminData?.prediction?.claims || [],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139,92,246,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8B5CF6',
        pointRadius: 5,
        yAxisID: 'y',
      },
      {
        label: 'Fraud Risk Index',
        data: (adminData?.prediction?.risk || []).map(v => +(v * 100).toFixed(1)),
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointBackgroundColor: '#F59E0B',
        pointRadius: 5,
        borderDash: [5, 3],
        yAxisID: 'y2',
      },
    ],
  };

  const predOptions = {
    ...chartDefaults,
    scales: {
      x: chartDefaults.scales.x,
      y: {
        ...chartDefaults.scales.y,
        position: 'left',
        ticks: { color: '#555', font: { size: 11 }, callback: v => `${v}` },
        title: { display: true, text: 'Claims', color: '#555', font: { size: 11 } },
      },
      y2: {
        ...chartDefaults.scales.y,
        position: 'right',
        grid: { display: false },
        ticks: { color: '#555', font: { size: 11 }, callback: v => `${v}%` },
        title: { display: true, text: 'Risk %', color: '#555', font: { size: 11 } },
      },
    },
  };

  const scoreColor = (s) => s >= 0.8 ? '#EF4444' : s >= 0.65 ? '#F59E0B' : '#22C55E';
  const scoreBg    = (s) => s >= 0.8 ? 'rgba(239,68,68,0.08)' : s >= 0.65 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)';
  const scoreBorder= (s) => s >= 0.8 ? 'rgba(239,68,68,0.25)' : s >= 0.65 ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)';

  return (
    <div className="dash-layout">
      {/* ── Admin Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-shield">🛡️</span>
          <span className="sidebar-brand">GigShield</span>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8, fontWeight: 600 }}>LIVE MODEL METRICS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#ddd' }}>Accuracy: <span className="teal">{(modelMetrics.accuracy * 100).toFixed(2)}%</span></div>
            <div style={{ fontSize: 12, color: '#ddd' }}>Precision: <span className="teal">{(modelMetrics.precision * 100).toFixed(2)}%</span></div>
            <div style={{ fontSize: 12, color: '#ddd' }}>Recall: <span className="teal">{(modelMetrics.recall * 100).toFixed(2)}%</span></div>
            <div style={{ fontSize: 12, color: '#ddd' }}>R²: <span className="teal">{modelMetrics.r2_score.toFixed(4)}</span></div>
            <div style={{ fontSize: 12, color: '#ddd' }}>MAE: <span className="teal">{modelMetrics.mae.toFixed(2)}</span></div>
          </div>
        </div>

        <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, paddingLeft: 4 }}>
          Admin Panel
        </div>

        <nav className="sidebar-nav">
          {[
            { icon: '📊', label: 'Overview',       onClick: () => {} , active: true },
            { icon: '🚨', label: 'Fraud Alerts',   onClick: () => document.getElementById('section-fraud')?.scrollIntoView({ behavior: 'smooth' }) },
            { icon: '📈', label: 'Claim Trends',   onClick: () => document.getElementById('section-trends')?.scrollIntoView({ behavior: 'smooth' }) },
            { icon: '🔮', label: '7-Day Forecast', onClick: () => document.getElementById('section-predict')?.scrollIntoView({ behavior: 'smooth' }) },
          ].map((item, i) => (
            <button
              key={i}
              className={`sidebar-nav-btn${item.active ? ' active' : ''}`}
              onClick={item.onClick}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            id="btn-goto-worker"
            className="sidebar-nav-btn"
            style={{ width: '100%', background: 'rgba(0,168,150,0.08)', border: '1px solid rgba(0,168,150,0.2)', color: '#00A896' }}
            onClick={() => navigate('/')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Worker View</span>
          </button>
        </div>
      </aside>

      {/* ── Admin Main ── */}
      <main className="dash-main">

        {/* Top Bar */}
        <div className="dash-topbar">
          <div>
            <div className="dash-greeting">Admin Dashboard 🔐</div>
            <div className="dash-subtext">
              GigShield Operations · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="badge badge-red" style={{ fontSize: 12 }}>🚨 {(adminData?.fraudAlerts || []).length} Fraud Alerts</span>
            <span className="badge badge-green" style={{ fontSize: 12 }}>● System Live</span>
          </div>
        </div>
        {loadFailed && (
          <div className="card" style={{ marginBottom: 16, border: '1px solid #EF4444', color: '#EF4444', fontWeight: 600 }}>
            Data unavailable
          </div>
        )}

        {/* ── Admin KPI Row ── */}
        <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="kpi-card kpi-teal" id="kpi-total-claims">
            <div className="kpi-icon">📋</div>
            <div className="kpi-body">
              <div className="kpi-label">Total Claims</div>
              <div className="kpi-value">{animClaims}</div>
              <div className="kpi-trend up">↑ 18% this week</div>
            </div>
          </div>

          <div className="kpi-card kpi-red" id="kpi-fraud-blocked">
            <div className="kpi-icon">🚫</div>
            <div className="kpi-body">
              <div className="kpi-label">Fraud Blocked</div>
              <div className="kpi-value">{animFraud}</div>
              <div className="kpi-trend" style={{ color: '#888' }}>₹{(animFraud * 412).toLocaleString()} saved</div>
            </div>
          </div>

          <div className="kpi-card kpi-amber" id="kpi-loss-ratio">
            <div className="kpi-icon">⚖️</div>
            <div className="kpi-body">
              <div className="kpi-label">Loss Ratio</div>
              <div className="kpi-value">{animLoss}%</div>
              <div className="kpi-trend down">↓ 4.1% vs last month</div>
            </div>
          </div>

          <div className="kpi-card kpi-purple" id="kpi-model-accuracy">
            <div className="kpi-icon">🤖</div>
            <div className="kpi-body">
              <div className="kpi-label">Model Accuracy</div>
              <div className="kpi-value">{animAcc}%</div>
              <div className="kpi-trend up">↑ Top 1% ML models</div>
            </div>
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="charts-row" id="section-trends">
          {/* Claim Trends */}
          <div className="chart-card" id="chart-claim-trends">
            <div className="chart-header">
              <div className="chart-title">📈 Claim Trends — Last 7 Days</div>
              <span className="badge badge-teal" style={{ fontSize: 11 }}>Live</span>
            </div>
            <div style={{ height: 220 }}>
              <Line data={claimTrendData} options={chartDefaults} />
            </div>
          </div>

          {/* 7-Day Prediction */}
          <div className="chart-card" id="section-predict">
            <div className="chart-header">
              <div className="chart-title">🔮 7-Day Forecast (AI Prediction)</div>
              <span className="badge badge-teal" style={{ fontSize: 11, background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', borderColor: 'rgba(139,92,246,0.35)' }}>
                ML Model
              </span>
            </div>
            <div style={{ height: 220 }}>
              <Line data={predData} options={predOptions} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12 }}>
                <span style={{ color: '#555' }}>Peak risk day: </span>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                  {adminData?.prediction?.labels?.[adminData?.prediction?.risk?.indexOf(Math.max(...(adminData?.prediction?.risk || [0])))] || 'Data unavailable'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Fraud Alerts + Platform Table ── */}
        <div className="bottom-row" id="section-fraud">
          {/* Fraud Alerts */}
          <div className="alerts-card">
            <div className="section-header">
              <div className="section-title">🚨 Fraud Alerts</div>
              <span className="badge badge-red" style={{ fontSize: 11 }}>
                {(adminData?.fraudAlerts || []).length} Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(adminData?.fraudAlerts || []).map((alert) => {
                const expanded = expandedAlert === alert.id;
                const color  = scoreColor(alert.score);
                const bg     = scoreBg(alert.score);
                const border = scoreBorder(alert.score);
                return (
                  <div
                    key={alert.id}
                    id={`fraud-alert-${alert.id}`}
                    onClick={() => setExpandedAlert(expanded ? null : alert.id)}
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 12,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Score gauge */}
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        border: `3px solid ${color}`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color, lineHeight: 1 }}>
                          {(alert.score * 100).toFixed(0)}
                        </div>
                        <div style={{ fontSize: 8, color: '#555' }}>score</div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#ddd' }}>{alert.worker}</span>
                          <span className={`badge ${alert.status === 'blocked' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                            {alert.status === 'blocked' ? '🚫 Blocked' : '⏳ Review'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                          {alert.platform} · ₹{alert.amount} claim · {alert.time}
                        </div>
                      </div>

                      <div style={{ fontSize: 10, color: '#444', flexShrink: 0 }}>
                        {expanded ? '▲' : '▼'}
                      </div>
                    </div>

                    {expanded && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${border}`, animation: 'fadeIn 0.2s ease' }}>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          Fraud Signals Flagged
                        </div>
                        {alert.flags.map((flag, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ color: '#EF4444', fontSize: 11 }}>⚠</span>
                            <span style={{ fontSize: 12, color: '#aaa' }}>{flag}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button
                            id={`btn-block-${alert.id}`}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)',
                              background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            }}
                          >
                            🚫 Confirm Block
                          </button>
                          <button
                            id={`btn-approve-${alert.id}`}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(34,197,94,0.4)',
                              background: 'rgba(34,197,94,0.1)', color: '#22C55E', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            }}
                          >
                            ✅ Override & Approve
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Platform Breakdown + Loss Ratio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Loss Ratio Gauge Card */}
            <div className="chart-card" id="card-loss-ratio">
              <div className="chart-header" style={{ marginBottom: 12 }}>
                <div className="chart-title">⚖️ Loss Ratio & Model Performance</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Loss Ratio', value: `${lossRatio}%`, sub: 'Payouts / Premiums collected', color: '#F59E0B', target: '< 60%' },
                  { label: 'Model Accuracy', value: `${modelAccuracy}%`, sub: 'Fraud detection precision', color: '#8B5CF6', target: '> 95% target' },
                  { label: 'Auto-Approval Rate', value: '87.1%', sub: 'Claims auto-resolved', color: '#22C55E', target: '> 80% target' },
                  { label: 'Avg Payout Time', value: '< 3 min', sub: 'End-to-end processing', color: '#00A896', target: 'SLA: 5 min' },
                ].map((m, i) => (
                  <div key={i} style={{
                    background: '#111520',
                    border: '1px solid #1e2130',
                    borderRadius: 12,
                    padding: 14,
                  }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: '-0.5px' }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>{m.sub}</div>
                    <div style={{ marginTop: 8, height: 4, background: '#1e2130', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: m.color,
                        width: m.label === 'Loss Ratio' ? `${lossRatio}%` :
                               m.label === 'Model Accuracy' ? `${modelAccuracy}%` :
                               m.label === 'Auto-Approval Rate' ? '87.1%' : '100%',
                        transition: 'width 1.2s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>Target: {m.target}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Breakdown Table */}
            <div className="payout-card" id="card-platform-breakdown">
              <div className="section-header">
                <div className="section-title">🏢 Platform Breakdown</div>
                <span className="badge badge-teal" style={{ fontSize: 11 }}>This Week</span>
              </div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 60px', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #1a1d24' }}>
                {['Platform', 'Claims', 'Payouts', 'Fraud'].map((h) => (
                  <div key={h} style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</div>
                ))}
              </div>

              {(adminData?.topPlatforms || []).map((p, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 60px 80px 60px',
                  gap: 8, padding: '10px 0',
                  borderBottom: i < (adminData?.topPlatforms || []).length - 1 ? '1px solid #13161e' : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: ['#00A896', '#8B5CF6', '#22C55E', '#F59E0B'][i],
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#ddd' }}>{p.name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>{p.claims}</div>
                  <div style={{ fontSize: 13, color: '#22C55E', fontWeight: 600 }}>₹{p.payout.toLocaleString()}</div>
                  <div>
                    <span className="badge badge-red" style={{ fontSize: 10, padding: '2px 8px' }}>{p.fraud}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
