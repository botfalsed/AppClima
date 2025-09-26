import React, { createContext, useState, ReactNode } from 'react';
import { 
  fetchWeatherByCity, 
  fetchCurrentWeather, 
  fetchExtendedForecast,
  searchCities,
  fetchAstronomy,
  WeatherData,
  CityData
} from '@/services/weatherApi';

interface WeatherContextType {
  weatherData: WeatherData | null;
  loading: boolean;
  error: string | null;
  searchResults: CityData[];
  searchLoading: boolean;
  astronomyData: any;
  fetchWeatherData: (city: string) => Promise<void>;
  fetchCurrentWeatherData: (city: string) => Promise<void>;
  fetchExtendedWeatherData: (city: string, days?: number) => Promise<void>;
  searchCitiesData: (query: string) => Promise<void>;
  fetchAstronomyData: (city: string, date?: string) => Promise<void>;
  clearError: () => void;
  clearSearchResults: () => void;
}

export const WeatherContext = createContext<WeatherContextType>({
  weatherData: null,
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
  astronomyData: null,
  fetchWeatherData: async () => {},
  fetchCurrentWeatherData: async () => {},
  fetchExtendedWeatherData: async () => {},
  searchCitiesData: async () => {},
  fetchAstronomyData: async () => {},
  clearError: () => {},
  clearSearchResults: () => {},
});

interface WeatherProviderProps {
  children: ReactNode;
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CityData[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [astronomyData, setAstronomyData] = useState<any>(null);

  const clearError = () => setError(null);
  const clearSearchResults = () => setSearchResults([]);

  // Obtener datos completos del clima (actual + pronóstico)
  const fetchWeatherData = async (city: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchWeatherByCity(city);
      setWeatherData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener datos del clima');
      console.error('Error fetching weather data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener solo datos actuales del clima
  const fetchCurrentWeatherData = async (city: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchCurrentWeather(city);
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener datos actuales del clima');
      console.error('Error fetching current weather data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener pronóstico extendido
  const fetchExtendedWeatherData = async (city: string, days: number = 14) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchExtendedForecast(city, days);
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener pronóstico extendido');
      console.error('Error fetching extended forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar ciudades
  const searchCitiesData = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setError(null);
    
    try {
      const results = await searchCities(query);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar ciudades');
      console.error('Error searching cities:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Obtener datos de astronomía
  const fetchAstronomyData = async (city: string, date?: string) => {
    try {
      const data = await fetchAstronomy(city, date);
      setAstronomyData(data);
    } catch (err) {
      console.error('Error fetching astronomy data:', err);
    }
  };

  return (
    <WeatherContext.Provider
      value={{
        weatherData,
        loading,
        error,
        searchResults,
        searchLoading,
        astronomyData,
        fetchWeatherData,
        fetchCurrentWeatherData,
        fetchExtendedWeatherData,
        searchCitiesData,
        fetchAstronomyData,
        clearError,
        clearSearchResults,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};