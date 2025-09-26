import React, { useContext, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { WeatherContext } from '../../contexts/WeatherContext';
import { getCurrentHourInTimezone, formatHourlyTime, isValidTimezone } from '../../utils/timeUtils';

export default function ClimaXHora() {
  const { weatherData, loading } = useContext(WeatherContext);

  // Mostrar estado de carga
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pronóstico por Horas</Text>
        <Text style={[styles.title, { fontSize: 16, opacity: 0.7 }]}>
          Cargando datos del clima...
        </Text>
      </View>
    );
  }

  // Verificar si tenemos datos básicos
  if (!weatherData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pronóstico por Horas</Text>
        <Text style={[styles.title, { fontSize: 16, opacity: 0.7 }]}>
          No hay datos del clima disponibles
        </Text>
      </View>
    );
  }

  // Memoizar los datos de pronóstico por horas para evitar recálculos innecesarios
  const hourlyData = useMemo(() => {
    type HourlyDataType = Array<{
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
    }>;

    let data: HourlyDataType = [];
    
    try {
      if (weatherData && 
          weatherData.forecast && 
          weatherData.forecast.forecastday && 
          Array.isArray(weatherData.forecast.forecastday) &&
          weatherData.forecast.forecastday.length > 0 &&
          weatherData.forecast.forecastday[0] &&
          weatherData.forecast.forecastday[0].hour &&
          Array.isArray(weatherData.forecast.forecastday[0].hour)) {
        
        // Obtener la hora actual de la ciudad usando la zona horaria correcta
        const timezone = weatherData.location?.tz_id;
        let currentHour: number;
        
        if (timezone && isValidTimezone(timezone)) {
          // Usar la zona horaria específica de la ubicación
          currentHour = getCurrentHourInTimezone(timezone);
        } else {
          // Fallback: usar la hora local de la API
          const currentLocalTime = weatherData.location?.localtime || new Date().toISOString();
          currentHour = new Date(currentLocalTime).getHours();
        }
        
        // Obtener todas las horas del día actual desde la hora actual
        const todayHours = weatherData.forecast.forecastday[0].hour.slice(currentHour);
        data = [...todayHours];
        
        // Si necesitamos más horas para completar 12, agregar del día siguiente
        if (data.length < 12 && 
            weatherData.forecast.forecastday.length > 1 &&
            weatherData.forecast.forecastday[1] &&
            weatherData.forecast.forecastday[1].hour &&
            Array.isArray(weatherData.forecast.forecastday[1].hour)) {
          const hoursNeeded = 12 - data.length;
          const tomorrowHours = weatherData.forecast.forecastday[1].hour.slice(0, hoursNeeded);
          data = [...data, ...tomorrowHours];
        }
        
        // Limitar a 12 horas máximo
        data = data.slice(0, 12);
      }
    } catch (error) {
      console.log('Error procesando datos por horas:', error);
      data = [];
    }

    return data;
  }, [
    weatherData?.forecast?.forecastday,
    weatherData?.location?.tz_id,
    weatherData?.location?.localtime
  ]);

  // Memoizar los datos actuales para el fallback
  const currentWeatherData = useMemo(() => {
    if (!weatherData?.current) return null;
    
    return {
      temperature: weatherData.current.temp_c !== undefined 
        ? Math.round(weatherData.current.temp_c) 
        : '--',
      condition: weatherData.current.condition?.text || 'N/A',
      feelsLike: weatherData.current.feelslike_c !== undefined 
        ? Math.round(weatherData.current.feelslike_c) 
        : '--',
      humidity: weatherData.current.humidity !== undefined 
        ? weatherData.current.humidity 
        : '--',
      windSpeed: weatherData.current.wind_kph !== undefined 
        ? Math.round(weatherData.current.wind_kph) 
        : '--'
    };
  }, [weatherData?.current]);

  // Optimizar la función formatTime con useCallback
  const formatTime = useCallback((timeString: string, isFirst: boolean = false) => {
    try {
      const timezone = weatherData?.location?.tz_id || '';
      return formatHourlyTime(timeString, timezone, isFirst);
    } catch (error) {
      console.log('Error formateando tiempo:', error);
      return 'N/A';
    }
  }, [weatherData?.location?.tz_id]);

  // Si no tenemos datos por horas, mostrar datos actuales
  if (hourlyData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pronóstico por Horas</Text>
        <Text style={[styles.title, { fontSize: 16, opacity: 0.7, marginBottom: 20 }]}>
          Mostrando datos actuales
        </Text>
        {currentWeatherData && (
          <View style={styles.currentDataContainer}>
            <Text style={styles.currentTemp}>
              {currentWeatherData.temperature}°C
            </Text>
            <Text style={styles.currentCondition}>
              {currentWeatherData.condition}
            </Text>
            <Text style={styles.currentDetails}>
              Sensación térmica: {currentWeatherData.feelsLike}°C
            </Text>
            <Text style={styles.currentDetails}>
              Humedad: {currentWeatherData.humidity}%
            </Text>
            <Text style={styles.currentDetails}>
              Viento: {currentWeatherData.windSpeed} km/h
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pronóstico por Horas</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {hourlyData.map((hour, index) => {
          if (!hour || typeof hour !== 'object') return null;
          
          return (
            <View key={`hour-${index}-${hour.time || index}`} style={styles.hourCard}>
              <Text style={styles.time}>
                 {hour.time ? formatTime(hour.time, index === 0) : 'N/A'}
               </Text>
              <Image 
                source={{ uri: `https:${hour.condition?.icon || ''}` }}
                style={styles.weatherIcon}
                resizeMode="contain"
              />
              <Text style={styles.temperature}>
                {hour.temp_c !== undefined ? Math.round(hour.temp_c) : '--'}°
              </Text>
              <Text style={styles.condition}>
                {hour.condition && hour.condition.text ? hour.condition.text : 'N/A'}
              </Text>
              <Text style={styles.detail}>
                {hour.chance_of_rain !== undefined ? hour.chance_of_rain : 0}% lluvia
              </Text>
            </View>
          );
        }).filter(Boolean)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    marginHorizontal: 20,
  },
  scrollView: {
    paddingLeft: 20,
  },
  hourCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  time: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 6,
    fontWeight: '500',
  },
  weatherIcon: {
    width: 32,
    height: 32,
    marginBottom: 6,
  },
  temperature: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  condition: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 4,
  },
  feelsLike: {
    fontSize: 9,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 2,
  },
  detail: {
    fontSize: 8,
    color: '#fff',
    opacity: 0.8,
    flex: 1,
    textAlign: 'center',
  },
  currentDataContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  currentTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  currentCondition: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 15,
    textAlign: 'center',
  },
  currentDetails: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 5,
  },
});
