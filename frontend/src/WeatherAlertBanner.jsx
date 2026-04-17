import React from 'react';

export default function WeatherAlertBanner({ message, subtext }) {
  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        border: '1px solid #F59E0B',
        color: '#F59E0B',
        fontWeight: 600,
      }}
    >
      {message}
      {subtext ? (
        <div style={{ marginTop: 6, fontSize: 12, color: '#d1d5db', fontWeight: 500 }}>
          {subtext}
        </div>
      ) : null}
    </div>
  );
}
