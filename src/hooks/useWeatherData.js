import { useState } from 'react';
import { fetchWeatherData, fetchForecastData } from '../utils/weatherAPI';

export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchData = async (city) => {
    if (!city) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const weather = await fetchWeatherData(city);
      setWeatherData(weather);
      
      try {
        const forecast = await fetchForecastData(city);
        setForecastData(forecast);
      } catch (forecastErr) {
        console.error("Forecast error:", forecastErr);
        // Still show weather data even if forecast fails
      }
    } catch (err) {
      setError(err.message || 'Could not fetch weather data. Please try again.');
      console.error(err);
      setWeatherData(null);
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    weatherData,
    forecastData,
    loading,
    error,
    fetchData
  };
};

export default useWeatherData;
