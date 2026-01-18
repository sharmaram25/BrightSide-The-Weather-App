import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import { fetchWeather, fetchForecast, fetchWeatherByCoords, fetchForecastByCoords, fetchAirQuality } from './services/api';
import Background from './components/Background';
import SearchBar from './components/SearchBar';
import CityPills from './components/CityPills';
import CurrentWeather from './components/CurrentWeather';
import Forecast from './components/Forecast';
import WeatherInsights from './components/WeatherInsights';
import DailyForecast from './components/DailyForecast';
import AdvancedStats from './components/AdvancedStats';
import AstroPanel from './components/AstroPanel';
import ActivityGuide from './components/ActivityGuide';
import Logo from './components/Logo';
import { Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    weather: null,
    forecast: null,
    airQuality: null,
    loading: true,
    error: null,
    unit: 'metric',
  });

  const loadData = async (weatherPromise: Promise<any>, forecastPromise: Promise<any>) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
          const [weather, forecast] = await Promise.all([weatherPromise, forecastPromise]);
          let airQuality = null;
          try {
             airQuality = await fetchAirQuality(weather.coord.lat, weather.coord.lon);
          } catch (e) {
         console.warn('Air quality fetch failed', e);
          }
          setState(prev => ({ ...prev, weather, forecast, airQuality, loading: false }));
      } catch (err) {
          setState(prev => ({ ...prev, loading: false, error: (err as Error).message }));
      }
  };

  const handleSearch = (city: string) => {
    loadData(fetchWeather(city), fetchForecast(city));
  };

  const loadUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          loadData(fetchWeatherByCoords(latitude, longitude), fetchForecastByCoords(latitude, longitude));
        },
        () => {
          handleSearch('London');
        }
      );
    } else {
      handleSearch('New York');
    }
  };

  useEffect(() => {
    loadUserLocation();
  }, []);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden selection:bg-orange-400/30 font-sans">
      <Background 
        weatherCode={state.weather?.weather[0].id || null} 
        timezone={state.weather?.timezone || 0}
      />

      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8 flex flex-col min-h-screen max-w-7xl">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <Logo />
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="hidden md:flex glass-pill px-3 py-1 text-[10px] font-mono items-center gap-2 text-white/60">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  LIVE FEED
               </div>
            </div>
        </header>

        <div className="flex flex-col items-center w-full max-w-2xl mx-auto mb-10 space-y-4">
            <SearchBar onSearch={handleSearch} loading={state.loading} />
            <CityPills onSelect={handleSearch} />
        </div>

        <main className="flex-grow w-full">
           <AnimatePresence mode="wait">
             {state.loading && !state.weather ? (
               <motion.div 
                 key="loader"
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="flex flex-col items-center justify-center min-h-[50vh]"
               >
                 <div className="relative">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                    <Loader2 className="h-16 w-16 animate-spin text-white relative z-10" />
                 </div>
                  <p className="mt-6 text-white/50 text-sm font-mono tracking-widest animate-pulse">LOADING...</p>
               </motion.div>
             ) : state.error ? (
                <motion.div 
                 key="error"
                 initial={{ opacity: 0, scale: 0.95 }} 
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0 }}
                 className="flex flex-col items-center justify-center min-h-[50vh]"
               >
                 <div className="glass-panel p-10 rounded-3xl text-center max-w-md border-red-500/30">
                     <WifiOff className="h-16 w-16 text-red-300 mx-auto mb-6 opacity-80" />
                     <h2 className="text-2xl font-bold mb-2">Connection Lost</h2>
                     <p className="text-white/60 mb-8">{state.error}. Please check your connection or city name.</p>
                     <button onClick={() => handleSearch('Tokyo')} className="glass-pill px-8 py-3 hover:bg-white/20 font-medium">Try Tokyo</button>
                 </div>
               </motion.div>
             ) : state.weather && state.forecast ? (
               <motion.div
                 key="dashboard"
                 initial={{ opacity: 0, y: 20 }} 
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.6, ease: "easeOut" }}
                 className="space-y-6 pb-20"
               >
                 <div className="w-full">
                    <CurrentWeather data={state.weather} />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]">
                    
                    <div className="col-span-1 md:col-span-2 xl:col-span-4 h-full">
                        <Forecast data={state.forecast} />
                    </div>

                    <div className="col-span-1 h-full">
                        <WeatherInsights weather={state.weather} aqi={state.airQuality} />
                    </div>

                    <div className="col-span-1 row-span-1 xl:row-span-2 h-full">
                         <DailyForecast data={state.forecast} />
                    </div>

                    <div className="col-span-1 md:col-span-2 xl:col-span-2 h-full">
                        <AdvancedStats data={state.weather} />
                    </div>

                    <div className="col-span-1 h-full">
                        <AstroPanel data={state.weather} />
                    </div>

                    <div className="col-span-1 h-full">
                        <ActivityGuide weather={state.weather} />
                    </div>

                 </div>
               </motion.div>
             ) : null}
           </AnimatePresence>
        </main>
        
        <footer className="py-8 border-t border-white/5 mt-12">
            <div className="flex flex-col md:flex-row justify-between items-center text-white/20 text-[10px] font-mono tracking-widest uppercase">
                <p> BrightSide v3.0</p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                    <span>Data: OpenWeather</span>
                    <span>Lat: {state.weather?.coord.lat.toFixed(2)}</span>
                    <span>Lon: {state.weather?.coord.lon.toFixed(2)}</span>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default App;