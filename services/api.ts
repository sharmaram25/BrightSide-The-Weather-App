import { WeatherData, ForecastData, AirQualityData } from '../types';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const requireApiKey = () => {
  if (!API_KEY) {
    throw new Error('Missing OpenWeather API key. Set VITE_OPENWEATHER_API_KEY in your .env.local');
  }
  return API_KEY;
};

export const fetchWeather = async (city: string): Promise<WeatherData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('City not found');
  }
  return response.json();
};

export const fetchWeatherByCoords = async (lat: number, lon: number): Promise<WeatherData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('Could not fetch weather data');
  }
  return response.json();
};

export const fetchForecast = async (city: string): Promise<ForecastData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('Forecast not available');
  }
  return response.json();
};

export const fetchForecastByCoords = async (lat: number, lon: number): Promise<ForecastData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('Forecast not available');
  }
  return response.json();
};

export const fetchAirQuality = async (lat: number, lon: number): Promise<AirQualityData> => {
  const apiKey = requireApiKey();
  const response = await fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
  if (!response.ok) {
    throw new Error('Air quality data unavailable');
  }
  return response.json();
};