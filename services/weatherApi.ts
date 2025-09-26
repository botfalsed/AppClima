// Weather API service
// API Key: 75bcd1d9950d4ef394222325252609

const API_KEY = '75bcd1d9950d4ef394222325252609';
const BASE_URL = 'https://api.weatherapi.com/v1';

export interface CityData {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  url: string;
}

// Nueva interfaz para calidad del aire
export interface AirQualityData {
  co: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  'us-epa-index': number;
  'gb-defra-index': number;
}

// Nueva interfaz para datos UV extendidos
export interface UVData {
  uv: number;
  uv_index_max: number;
  uv_index_clear_sky_max: number;
  uv_forecast: Array<{
    time: string;
    uv: number;
  }>;
}

// Nueva interfaz para alertas personalizadas
export interface AlertConfig {
  id: string;
  type: 'temperature_high' | 'temperature_low' | 'rain' | 'wind' | 'uv' | 'air_quality';
  enabled: boolean;
  value: number;
  city: string;
  message: string;
  useCurrentLocation?: boolean;
}

// Nueva interfaz para recomendaciones de vestimenta
export interface ClothingRecommendation {
  category: string;
  items: string[];
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
    tz_id: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_kph: number;
    wind_mph: number;
    wind_dir: string;
    humidity: number;
    feelslike_c: number;
    feelslike_f: number;
    uv: number;
    precip_mm: number;
    precip_in: number;
    pressure_mb: number;
    pressure_in: number;
    vis_km: number;
    vis_miles: number;
    is_day: number;
    gust_kph: number;
    gust_mph: number;
    air_quality?: AirQualityData;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        maxwind_kph: number;
        maxwind_mph: number;
        totalprecip_mm: number;
        totalprecip_in: number;
        totalsnow_cm: number;
        avgvis_km: number;
        avgvis_miles: number;
        avghumidity: number;
        daily_will_it_rain: number;
        daily_chance_of_rain: number;
        daily_will_it_snow: number;
        daily_chance_of_snow: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        uv: number;
        air_quality?: AirQualityData;
      };
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: string;
      };
      hour: Array<{
        time_epoch: number;
        time: string;
        temp_c: number;
        temp_f: number;
        is_day: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        wind_kph: number;
        wind_mph: number;
        wind_dir: string;
        pressure_mb: number;
        pressure_in: number;
        precip_mm: number;
        precip_in: number;
        humidity: number;
        cloud: number;
        feelslike_c: number;
        feelslike_f: number;
        windchill_c: number;
        windchill_f: number;
        heatindex_c: number;
        heatindex_f: number;
        dewpoint_c: number;
        dewpoint_f: number;
        will_it_rain: number;
        chance_of_rain: number;
        will_it_snow: number;
        chance_of_snow: number;
        vis_km: number;
        vis_miles: number;
        gust_kph: number;
        gust_mph: number;
        uv: number;
        air_quality?: AirQualityData;
      }>;
    }>;
  };
  alerts?: {
    alert: Array<{
      headline: string;
      msgtype: string;
      severity: string;
      urgency: string;
      areas: string;
      category: string;
      certainty: string;
      event: string;
      note: string;
      effective: string;
      expires: string;
      desc: string;
      instruction: string;
    }>;
  };
}

export const fetchWeatherByCity = async (city: string): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=7&aqi=yes&alerts=yes&lang=es`
    );
    
    if (!response.ok) {
      throw new Error('Ciudad no encontrada o error en la API');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

export const searchCities = async (query: string): Promise<CityData[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/search.json?key=${API_KEY}&q=${query}`
    );
    
    if (!response.ok) {
      throw new Error('Error en la búsqueda de ciudades');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching cities:', error);
    throw error;
  }
};

// Obtener solo datos actuales del clima
export const fetchCurrentWeather = async (city: string): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/current.json?key=${API_KEY}&q=${city}&aqi=yes&lang=es`
    );
    
    if (!response.ok) {
      throw new Error('Ciudad no encontrada o error en la API');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching current weather:', error);
    throw error;
  }
};

// Obtener pronóstico extendido (hasta 14 días)
export const fetchExtendedForecast = async (city: string, days: number = 14): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=${Math.min(days, 14)}&aqi=yes&alerts=yes&lang=es`
    );
    
    if (!response.ok) {
      throw new Error('Ciudad no encontrada o error en la API');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching extended forecast:', error);
    throw error;
  }
};

// Obtener datos históricos del clima
export const fetchHistoricalWeather = async (city: string, date: string): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/history.json?key=${API_KEY}&q=${city}&dt=${date}&lang=es`
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener datos históricos');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching historical weather:', error);
    throw error;
  }
};

// Obtener datos de astronomía
export const fetchAstronomy = async (city: string, date?: string): Promise<any> => {
  try {
    const dateParam = date ? `&dt=${date}` : '';
    const response = await fetch(
      `${BASE_URL}/astronomy.json?key=${API_KEY}&q=${city}${dateParam}`
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener datos de astronomía');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching astronomy data:', error);
    throw error;
  }
};

// Obtener zona horaria
export const fetchTimezone = async (city: string): Promise<any> => {
  try {
    const response = await fetch(
      `${BASE_URL}/timezone.json?key=${API_KEY}&q=${city}`
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener zona horaria');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching timezone:', error);
    throw error;
  }
};

// Nueva función para obtener datos específicos de calidad del aire
export const fetchAirQuality = async (city: string): Promise<AirQualityData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/current.json?key=${API_KEY}&q=${city}&aqi=yes`
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener datos de calidad del aire');
    }
    
    const data = await response.json();
    return data.current.air_quality;
  } catch (error) {
    console.error('Error fetching air quality:', error);
    throw error;
  }
};

// Nueva función para obtener pronóstico UV por horas
export const fetchUVForecast = async (city: string): Promise<UVData> => {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=3&aqi=no&alerts=no`
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener pronóstico UV');
    }
    
    const data = await response.json();
    
    // Procesar datos UV por horas
    const uvForecast = data.forecast.forecastday[0].hour.map((hour: any) => ({
      time: hour.time,
      uv: hour.uv
    }));
    
    return {
      uv: data.current.uv,
      uv_index_max: data.forecast.forecastday[0].day.uv,
      uv_index_clear_sky_max: data.forecast.forecastday[0].day.uv,
      uv_forecast: uvForecast
    };
  } catch (error) {
    console.error('Error fetching UV forecast:', error);
    throw error;
  }
};

// Nueva función para generar recomendaciones de vestimenta
export const getClothingRecommendations = (weatherData: WeatherData): ClothingRecommendation[] => {
  const temp = weatherData.current.temp_c;
  const condition = weatherData.current.condition.text.toLowerCase();
  const windSpeed = weatherData.current.wind_kph;
  const humidity = weatherData.current.humidity;
  const uv = weatherData.current.uv;
  
  const recommendations: ClothingRecommendation[] = [];
  
  // Recomendaciones por temperatura
  if (temp <= 0) {
    recommendations.push({
      category: 'Abrigo Extremo',
      items: ['Abrigo de invierno', 'Bufanda', 'Guantes', 'Gorro', 'Botas térmicas'],
      icon: 'snowflake',
      priority: 'high'
    });
  } else if (temp <= 10) {
    recommendations.push({
      category: 'Abrigo',
      items: ['Chaqueta', 'Suéter', 'Pantalones largos', 'Zapatos cerrados'],
      icon: 'thermometer.low',
      priority: 'high'
    });
  } else if (temp <= 20) {
    recommendations.push({
      category: 'Ropa Moderada',
      items: ['Chaqueta ligera', 'Camiseta manga larga', 'Jeans', 'Zapatos cómodos'],
      icon: 'thermometer.medium',
      priority: 'medium'
    });
  } else if (temp <= 30) {
    recommendations.push({
      category: 'Ropa Ligera',
      items: ['Camiseta', 'Pantalones cortos', 'Sandalias', 'Gorra'],
      icon: 'sun.max',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      category: 'Ropa Muy Ligera',
      items: ['Ropa de algodón', 'Shorts', 'Camiseta sin mangas', 'Sandalias', 'Sombrero'],
      icon: 'thermometer.high',
      priority: 'high'
    });
  }
  
  // Recomendaciones por lluvia
  if (condition.includes('lluvia') || condition.includes('rain') || condition.includes('drizzle')) {
    recommendations.push({
      category: 'Protección contra lluvia',
      items: ['Paraguas', 'Impermeable', 'Botas de lluvia'],
      icon: 'cloud.rain',
      priority: 'high'
    });
  }
  
  // Recomendaciones por viento
  if (windSpeed > 20) {
    recommendations.push({
      category: 'Protección contra viento',
      items: ['Cortavientos', 'Ropa ajustada', 'Gorro con correa'],
      icon: 'wind',
      priority: 'medium'
    });
  }
  
  // Recomendaciones por UV
  if (uv > 6) {
    recommendations.push({
      category: 'Protección solar',
      items: ['Protector solar', 'Gafas de sol', 'Sombrero', 'Ropa con protección UV'],
      icon: 'sun.max.fill',
      priority: 'high'
    });
  }
  
  return recommendations;
};

// Nueva función para verificar alertas personalizadas
export const checkAlerts = async (alerts: AlertConfig[]): Promise<AlertConfig[]> => {
  const triggeredAlerts: AlertConfig[] = [];
  
  for (const alert of alerts) {
    if (!alert.enabled) continue;
    
    try {
      const weatherData = await fetchCurrentWeather(alert.city);
      let shouldTrigger = false;
      
      switch (alert.type) {
        case 'temperature_high':
          shouldTrigger = weatherData.current.temp_c >= alert.value;
          break;
        case 'temperature_low':
          shouldTrigger = weatherData.current.temp_c <= alert.value;
          break;
        case 'rain':
          shouldTrigger = weatherData.current.precip_mm >= alert.value;
          break;
        case 'wind':
          shouldTrigger = weatherData.current.wind_kph >= alert.value;
          break;
        case 'uv':
          shouldTrigger = weatherData.current.uv >= alert.value;
          break;
        case 'air_quality':
          if (weatherData.current.air_quality) {
            shouldTrigger = weatherData.current.air_quality['us-epa-index'] >= alert.value;
          }
          break;
      }
      
      if (shouldTrigger) {
        triggeredAlerts.push(alert);
      }
    } catch (error) {
      console.error(`Error checking alert for ${alert.city}:`, error);
    }
  }
  
  return triggeredAlerts;
};

// Nueva función para obtener coordenadas de geolocalización
import GeolocationService, { LocationData } from './geolocationService';

// Función mejorada para obtener ubicación actual
export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    const geoService = GeolocationService.getInstance();
    await geoService.initialize();
    return await geoService.getCurrentLocation();
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

// Función para obtener clima por coordenadas con geolocalización automática
export const fetchWeatherByCoordinates = async (
  lat?: number, 
  lon?: number, 
  useCurrentLocation: boolean = true
): Promise<WeatherData> => {
  try {
    let latitude = lat;
    let longitude = lon;

    // Si no se proporcionan coordenadas y se solicita usar ubicación actual
    if ((!latitude || !longitude) && useCurrentLocation) {
      const location = await getCurrentLocation();
      if (location) {
        latitude = location.latitude;
        longitude = location.longitude;
      } else {
        throw new Error('No se pudo obtener la ubicación actual');
      }
    }

    if (!latitude || !longitude) {
      throw new Error('Coordenadas no disponibles');
    }

    const response = await fetch(
      `${BASE_URL}/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=7&aqi=yes&alerts=yes&lang=es`
    );
    
    if (!response.ok) {
      throw new Error('Error obteniendo datos del clima por coordenadas');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather by coordinates:', error);
    throw error;
  }
};

// Función para obtener clima automáticamente (ubicación actual o ciudad por defecto)
export const fetchAutoWeather = async (defaultCity: string = 'Madrid'): Promise<WeatherData> => {
  try {
    // Intentar obtener ubicación actual primero
    const location = await getCurrentLocation();
    
    if (location) {
      console.log(`Usando ubicación actual: ${location.city || 'Ubicación detectada'}`);
      return await fetchWeatherByCoordinates(location.latitude, location.longitude, false);
    } else {
      console.log(`Usando ciudad por defecto: ${defaultCity}`);
      return await fetchWeatherByCity(defaultCity);
    }
  } catch (error) {
    console.error('Error in auto weather fetch:', error);
    // Fallback a ciudad por defecto
    return await fetchWeatherByCity(defaultCity);
  }
};