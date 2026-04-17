const CITY_CONFIG = [
  { name: "Pune", lat: 18.5204, lon: 73.8567 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
];

async function fetchWeather(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return { source: "synthetic", rainfall_mm: 0 };
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`openweather_${response.status}`);
  }
  const payload = await response.json();
  const rainfall = Number(payload?.rain?.["1h"] || payload?.rain?.["3h"] || 0);
  return { source: "openweather", rainfall_mm: rainfall };
}

function startWeatherCron({ io, triggerClaims }) {
  const run = async () => {
    for (const city of CITY_CONFIG) {
      try {
        const weatherData = await fetchWeather(city);
        if (weatherData.rainfall_mm > 50) {
          await triggerClaims(city.name, weatherData);
          io.emit("WEATHER_ALERT", {
            event: "rain_alert",
            zone: city.name,
            rainfall_mm: weatherData.rainfall_mm,
            source: weatherData.source,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (_error) {
      }
    }
  };
  run();
  setInterval(run, 5 * 60 * 1000);
}

module.exports = { startWeatherCron };
