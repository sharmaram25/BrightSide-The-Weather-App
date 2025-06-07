// filepath: c:\Users\sharm\OneDrive\Desktop\Web Projects\BrightSide\brightside\src\components\WeatherCard\WeatherCard.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeatherIcon, formatDate, formatTime } from '../../utils/weatherAPI';
import './WeatherCard.css';

// Get weather condition background
const getWeatherGradient = (condition) => {
  const conditions = {
    'Clear': 'linear-gradient(135deg, rgba(255, 165, 0, 0.2), rgba(255, 99, 71, 0.2))',
    'Clouds': 'linear-gradient(135deg, rgba(169, 169, 169, 0.2), rgba(119, 136, 153, 0.2))',
    'Rain': 'linear-gradient(135deg, rgba(0, 0, 139, 0.2), rgba(30, 144, 255, 0.2))',
    'Drizzle': 'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(135, 206, 250, 0.2))',
    'Thunderstorm': 'linear-gradient(135deg, rgba(47, 79, 79, 0.3), rgba(25, 25, 112, 0.2))',
    'Snow': 'linear-gradient(135deg, rgba(240, 248, 255, 0.3), rgba(230, 230, 250, 0.2))',
    'Mist': 'linear-gradient(135deg, rgba(220, 220, 220, 0.2), rgba(240, 248, 255, 0.2))',
    'Fog': 'linear-gradient(135deg, rgba(220, 220, 220, 0.2), rgba(211, 211, 211, 0.2))',
    'Haze': 'linear-gradient(135deg, rgba(220, 220, 220, 0.2), rgba(169, 169, 169, 0.2))',
    'default': 'linear-gradient(135deg, rgba(70, 130, 180, 0.2), rgba(123, 104, 238, 0.2))'
  };
  
  return conditions[condition] || conditions.default;
};

// Get weather emoji
const getWeatherEmoji = (condition) => {
  const emojis = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️',
    'default': '🌡️'
  };
  
  return emojis[condition] || emojis.default;
};

// Get weather tips
const getWeatherTips = (condition, temp) => {
  const conditions = {
    'Clear': [
      'Apply sunscreen with at least SPF 30',
      'Wear sunglasses to protect your eyes',
      'Stay hydrated throughout the day',
      'Seek shade during peak sun hours'
    ],
    'Clouds': [
      'Perfect weather for outdoor activities',
      'Good day for photography with diffused light',
      'Temperature might change quickly, dress in layers',
      'UV rays can still penetrate clouds, consider sunscreen'
    ],
    'Rain': [
      'Remember to carry an umbrella',
      'Wear waterproof footwear',
      'Drive carefully on wet roads',
      'Avoid flooded areas if rain is heavy'
    ],
    'Drizzle': [
      'Light rain jacket or umbrella recommended',
      'Roads may be slippery despite light rain',
      'Perfect weather for indoor activities',
      'Plants love this weather - good time for gardening'
    ],
    'Thunderstorm': [
      'Stay indoors and away from windows',
      'Avoid open areas, tall isolated trees, or metal objects outside',
      'Unplug electronic devices if possible',
      'Have emergency lights ready in case of power outage'
    ],
    'Snow': [
      'Dress in warm layers to trap body heat',
      'Wear insulated waterproof boots',
      'Drive slowly and increase following distance',
      'Keep emergency supplies in your vehicle'
    ],
    'Mist': [
      'Use fog lights when driving',
      'Maintain extra distance between vehicles',
      'Wear reflective clothing if walking',
      'Breathe through your nose to warm the air if cold'
    ],
    'Fog': [
      'Reduce speed when driving and use fog lights',
      'Be extra cautious at intersections',
      'Avoid using high beam headlights',
      'Allow extra time for travel'
    ],
    'default': [
      'Check the forecast before planning outdoor activities',
      'Dress appropriately for the current temperature',
      'Stay hydrated regardless of weather',
      'Consider air quality for outdoor exercise'
    ]
  };

  // Temperature-specific tips
  let tempTips = [];
  if (temp > 30) {
    tempTips = [
      'High temperature alert! Stay hydrated',
      'Seek shade during peak sun hours (10am-4pm)',
      'Watch for signs of heat exhaustion',
      'Cool, lightweight clothing recommended'
    ];
  } else if (temp < 10) {
    tempTips = [
      'Dress warmly in layers to trap heat',
      'Protect extremities with gloves and hat',
      'Watch for signs of hypothermia',
      'Keep your living space adequately heated'
    ];
  }

  const weatherTips = conditions[condition] || conditions.default;
  
  // Combine weather and temperature tips
  return tempTips.length > 0 
    ? [...tempTips.slice(0, 2), ...weatherTips.slice(0, 2)] 
    : weatherTips;
};

const WeatherCard = ({ weatherData, forecastData }) => {
  const [activeTab, setActiveTab] = useState('current');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [animateWeather, setAnimateWeather] = useState(false);
  
  useEffect(() => {
    // Trigger animation when weather data changes
    if (weatherData) {
      setAnimateWeather(true);
      const timer = setTimeout(() => setAnimateWeather(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [weatherData]);
  
  if (!weatherData) return null;

  const { name, main, weather, wind, sys, visibility, clouds } = weatherData;
  const { temp, feels_like, temp_min, temp_max, humidity, pressure } = main;
  const { description, icon, main: weatherMain } = weather[0];
  const weatherIconUrl = getWeatherIcon(icon);
  const weatherGradient = getWeatherGradient(weatherMain);
  const weatherEmoji = getWeatherEmoji(weatherMain);
  const weatherTips = getWeatherTips(weatherMain, temp);
  
  // Create a forecast summary - next 3 days from forecast data
  const forecastSummary = forecastData?.list
    ? forecastData.list
        .filter((item, index) => index % 8 === 0) // Get one forecast per day (every 8th entry)
        .slice(0, 3) // Only next 3 days
    : [];

  return (
    <motion.div
      className="weather-card-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="weather-card"
        style={{ 
          backgroundImage: activeTab === 'current' ? weatherGradient : 'none',
          backgroundSize: '200% 200%',
          animation: activeTab === 'current' ? 'gradient-animation 15s ease infinite' : 'none'
        }}
        animate={{ 
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2), 0 0 15px rgba(94, 114, 228, 0.3)' 
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="tabs-container">
          <motion.div 
            className={`tab ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Now
          </motion.div>
          <motion.div 
            className={`tab ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecast')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Forecast
          </motion.div>
          <motion.div 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Details
          </motion.div>
          <motion.div 
            className={`tab ${activeTab === 'tips' ? 'active' : ''}`}
            onClick={() => setActiveTab('tips')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Tips
          </motion.div>
          <motion.div 
            className="tab-indicator"
            animate={{ 
              left: activeTab === 'current' ? '0%' : 
                   activeTab === 'forecast' ? '25%' : 
                   activeTab === 'details' ? '50%' : '75%',
              width: '25%'
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        
        <AnimatePresence mode="wait">
          {activeTab === 'current' && (
            <motion.div 
              key="current"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="weather-card-header">
                <motion.div 
                  className="location-info"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2>{name} <span className="country-badge">{sys.country}</span></h2>
                  <p className="date">{formatDate(Date.now() / 1000)}</p>
                  <div className="weather-badge">
                    {weatherEmoji} {description}
                  </div>
                </motion.div>
                <motion.div 
                  className="temp-info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h1>{Math.round(temp)}°C</h1>
                  <p>Feels like {Math.round(feels_like)}°C</p>
                </motion.div>
              </div>

              <div className="weather-card-body">
                <motion.div 
                  className="weather-icon-container"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <img 
                    src={weatherIconUrl} 
                    alt={description} 
                    className={`weather-icon-img ${animateWeather ? 'pulse' : ''}`}
                  />
                  <div className="temp-range">
                    <div className="temp-min">
                      <span className="temp-label">Min</span>
                      <span className="temp-value">{Math.round(temp_min)}°C</span>
                    </div>
                    <div className="temp-separator"></div>
                    <div className="temp-max">
                      <span className="temp-label">Max</span>
                      <span className="temp-value">{Math.round(temp_max)}°C</span>
                    </div>
                  </div>
                </motion.div>

                <div className="weather-highlights">
                  <h3 className="highlights-title">Today's Highlights</h3>
                  <div className="highlights-grid">
                    <motion.div 
                      className="highlight-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="highlight-label">Humidity</div>
                      <div className="highlight-value">{humidity}%</div>
                      <div className="highlight-meter">
                        <div className="meter-fill" style={{ width: `${humidity}%` }}></div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="highlight-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="highlight-label">Wind Speed</div>
                      <div className="highlight-value">{Math.round(wind.speed)} <span className="unit">m/s</span></div>
                      <div className="wind-direction" style={{ transform: `rotate(${wind.deg}deg)` }}>
                        <span>↑</span>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="highlight-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="highlight-label">Sunrise</div>
                      <div className="highlight-value sunrise-time">{formatTime(sys.sunrise)}</div>
                      <div className="sun-icon">🌅</div>
                    </motion.div>
                    
                    <motion.div 
                      className="highlight-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="highlight-label">Sunset</div>
                      <div className="highlight-value sunset-time">{formatTime(sys.sunset)}</div>
                      <div className="sun-icon">🌇</div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'forecast' && forecastSummary.length > 0 && (
            <motion.div 
              key="forecast"
              className="forecast-tab-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="forecast-title">3-Day Forecast</h3>
              <div className="forecast-grid">
                {forecastSummary.map((item, index) => (
                  <motion.div
                    key={index}
                    className="forecast-day-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 * index, duration: 0.4 }}
                    whileHover={{ 
                      y: -10,
                      boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2), 0 0 15px rgba(94, 114, 228, 0.3)'
                    }}
                  >
                    <div className="forecast-day-header">
                      <h4 className="forecast-day">{formatDate(item.dt)}</h4>
                    </div>
                    <div className="forecast-day-body">
                      <img
                        src={getWeatherIcon(item.weather[0].icon)}
                        alt={item.weather[0].description}
                        className="forecast-day-icon"
                      />
                      <div className="forecast-day-temp">{Math.round(item.main.temp)}°C</div>
                      <div className="forecast-day-desc">{item.weather[0].description}</div>
                      <div className="forecast-day-details">
                        <div className="forecast-detail">
                          <span className="detail-label">Humidity</span>
                          <span className="detail-value">{item.main.humidity}%</span>
                        </div>
                        <div className="forecast-detail">
                          <span className="detail-label">Wind</span>
                          <span className="detail-value">{Math.round(item.wind.speed)} m/s</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {activeTab === 'details' && (
            <motion.div 
              key="details"
              className="details-tab-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="details-title">Weather Details</h3>
              <div className="details-grid">
                <motion.div 
                  className="detail-card"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDetail('pressure')}
                >
                  <div className="detail-card-inner">
                    <div className="detail-icon">🌡️</div>
                    <div className="detail-info">
                      <div className="detail-name">Pressure</div>
                      <div className="detail-value">{pressure} hPa</div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="detail-card"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDetail('visibility')}
                >
                  <div className="detail-card-inner">
                    <div className="detail-icon">👁️</div>
                    <div className="detail-info">
                      <div className="detail-name">Visibility</div>
                      <div className="detail-value">{(visibility / 1000).toFixed(1)} km</div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="detail-card"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDetail('clouds')}
                >
                  <div className="detail-card-inner">
                    <div className="detail-icon">☁️</div>
                    <div className="detail-info">
                      <div className="detail-name">Cloudiness</div>
                      <div className="detail-value">{clouds.all}%</div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="detail-card"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDetail('feels')}
                >
                  <div className="detail-card-inner">
                    <div className="detail-icon">🌡️</div>
                    <div className="detail-info">
                      <div className="detail-name">Feels Like</div>
                      <div className="detail-value">{Math.round(feels_like)}°C</div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              <div className="weather-tip">
                <div className="tip-icon">💡</div>
                <div className="tip-content">
                  {weatherMain === 'Rain' && 'Don\'t forget your umbrella today!'}
                  {weatherMain === 'Clear' && 'Perfect day to spend some time outside!'}
                  {weatherMain === 'Clouds' && 'Partly cloudy conditions - a good day for outdoor activities.'}
                  {weatherMain === 'Snow' && 'Bundle up and drive safely in these snowy conditions!'}
                  {!['Rain', 'Clear', 'Clouds', 'Snow'].includes(weatherMain) && 'Check the forecast regularly for weather updates!'}
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'tips' && (
            <motion.div 
              key="tips"
              className="tips-tab-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="tips-title">Weather Tips</h3>
              <div className="weather-condition-banner">
                <div className="condition-icon">{weatherEmoji}</div>
                <div className="condition-info">
                  <p className="condition-name">{weatherMain}</p>
                  <p className="condition-temp">{Math.round(temp)}°C</p>
                </div>
              </div>

              <div className="tips-container">
                {weatherTips.map((tip, index) => (
                  <motion.div 
                    key={index}
                    className="tip-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <div className="tip-number">{index + 1}</div>
                    <div className="tip-text">{tip}</div>
                  </motion.div>
                ))}
              </div>
              
              <motion.div 
                className="daily-advice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <div className="advice-header">
                  <span className="advice-icon">🔍</span>
                  <h4>Did you know?</h4>
                </div>
                <p className="advice-text">
                  {weatherMain === 'Clear' && 'UV radiation can still be harmful even on cool, clear days. Always protect your skin when spending time outdoors.'}
                  {weatherMain === 'Clouds' && 'Clouds act as Earth\'s thermostat, reflecting sunlight back to space and trapping heat below.'}
                  {weatherMain === 'Rain' && 'Just one inch of rainfall drops 27,000 gallons of water on one acre of land!'}
                  {weatherMain === 'Snow' && 'No two snowflakes are exactly alike, but they all have six sides.'}
                  {weatherMain === 'Thunderstorm' && 'Lightning is five times hotter than the surface of the sun!'}
                  {weatherMain === 'Drizzle' && 'Drizzle droplets are smaller than 0.5mm in diameter - much smaller than regular raindrops.'}
                  {weatherMain === 'Fog' && 'Fog is actually a cloud that forms at ground level.'}
                  {!['Clear', 'Clouds', 'Rain', 'Snow', 'Thunderstorm', 'Drizzle', 'Fog'].includes(weatherMain) && 'The weather affects our mood - sunny days can boost serotonin levels, while rainy days might make us more contemplative.'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default WeatherCard;
