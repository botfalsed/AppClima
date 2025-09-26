import React, { useContext, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { WeatherContext } from '../../contexts/WeatherContext';
import { getCurrentTime12HourInTimezone, isValidTimezone } from '../../utils/timeUtils';

export default function ClimaActual() {
  const { weatherData, loading, error } = useContext(WeatherContext);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!weatherData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay datos disponibles</Text>
      </View>
    );
  }

  const { current, location } = weatherData;

  // Memoizar la fecha y el día para evitar recálculos innecesarios
  const dateInfo = useMemo(() => {
    try {
      // Validar que location existe y tiene las propiedades necesarias
      if (!location) {
        console.log('Location no está disponible');
        throw new Error('Location no disponible');
      }

      console.log('Location data:', {
        tz_id: location.tz_id,
        localtime: location.localtime,
        name: location.name
      });

      const timezone = location.tz_id;
      let currentDate: Date;
      
      if (timezone && typeof timezone === 'string' && isValidTimezone(timezone)) {
        // Usar la zona horaria específica de la ubicación
        currentDate = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
        console.log('Usando timezone:', timezone, 'Fecha:', currentDate);
      } else if (location.localtime && typeof location.localtime === 'string') {
        // Fallback: usar la fecha local de la API
        currentDate = new Date(location.localtime);
        console.log('Usando localtime:', location.localtime, 'Fecha:', currentDate);
      } else {
        // Último fallback: usar fecha actual
        currentDate = new Date();
        console.log('Usando fecha actual como fallback:', currentDate);
      }
      
      // Validar que la fecha es válida
      if (isNaN(currentDate.getTime())) {
        console.log('Fecha inválida, usando fecha actual');
        currentDate = new Date();
      }
      
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      const dayIndex = currentDate.getDay();
      const monthIndex = currentDate.getMonth();
      const day = currentDate.getDate();
      const year = currentDate.getFullYear();
      
      // Validar índices
      if (dayIndex < 0 || dayIndex >= dayNames.length) {
        throw new Error(`Índice de día inválido: ${dayIndex}`);
      }
      if (monthIndex < 0 || monthIndex >= monthNames.length) {
        throw new Error(`Índice de mes inválido: ${monthIndex}`);
      }
      if (isNaN(day) || isNaN(year)) {
        throw new Error(`Día o año inválido: día=${day}, año=${year}`);
      }
      
      const dayName = dayNames[dayIndex];
      const month = monthNames[monthIndex];
      
      console.log('Fecha formateada:', { dayName, day, month, year });
      
      return {
        dayName: dayName || 'Día',
        fullDate: `${day} de ${month}, ${year}`
      };
    } catch (error) {
      console.log('Error formateando fecha:', error);
      const now = new Date();
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      return {
        dayName: dayNames[now.getDay()] || 'Día',
        fullDate: `${now.getDate()} de ${monthNames[now.getMonth()]}, ${now.getFullYear()}`
      };
    }
  }, [location?.tz_id, location?.localtime, location?.name]);

  // Memoizar los datos del clima actual para evitar recálculos
  const weatherInfo = useMemo(() => {
    if (!current) return null;
    
    return {
      temperature: Math.round(current.temp_c),
      feelsLike: Math.round(current.feelslike_c),
      condition: current.condition?.text || 'N/A',
      icon: current.condition?.icon ? `https:${current.condition.icon}` : null,
      humidity: current.humidity,
      windSpeed: current.wind_kph,
      windDirection: current.wind_dir,
      pressure: current.pressure_mb,
      visibility: current.vis_km,
      uvIndex: current.uv,
      precipitation: current.precip_mm,
      gustSpeed: current.gust_kph
    };
  }, [current]);

  // Memoizar la hora local
  const localTime = useMemo(() => {
    try {
      // Usar la zona horaria de la ubicación si está disponible y es válida
      const timezone = location?.tz_id;
      if (timezone && isValidTimezone(timezone)) {
        return getCurrentTime12HourInTimezone(timezone);
      } else {
        // Fallback: usar la hora local de la API
        return new Date(location?.localtime || new Date()).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch (error) {
      console.log('Error mostrando hora local:', error);
      // Fallback final: hora del sistema
      return new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }, [location?.tz_id, location?.localtime]);

  // Verificar que tenemos datos memoizados válidos
  if (!weatherInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay datos del clima disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.locationContainer}>
        <Text style={styles.locationText}>{location?.name || 'Ubicación desconocida'}</Text>
        <Text style={styles.countryText}>{location?.country || ''}</Text>
      </View>
      
      <View style={styles.dateContainer}>
        <Text style={styles.dayText}>{dateInfo.dayName}</Text>
        <Text style={styles.dateText}>{dateInfo.fullDate}</Text>
      </View>
      
      <View style={styles.temperatureContainer}>
        <View style={styles.tempAndIcon}>
          <Text style={styles.temperature}>{weatherInfo.temperature}°</Text>
          {weatherInfo.icon && (
            <Image 
              source={{ uri: weatherInfo.icon }}
              style={styles.weatherIcon}
              resizeMode="contain"
            />
          )}
        </View>
        <Text style={styles.condition}>{weatherInfo.condition}</Text>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Sensación térmica</Text>
          <Text style={styles.detailValue}>{weatherInfo.feelsLike}°</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Humedad</Text>
          <Text style={styles.detailValue}>{weatherInfo.humidity}%</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Viento</Text>
          <Text style={styles.detailValue}>{weatherInfo.windSpeed} km/h {weatherInfo.windDirection}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Presión</Text>
          <Text style={styles.detailValue}>{weatherInfo.pressure} mb</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Visibilidad</Text>
          <Text style={styles.detailValue}>{weatherInfo.visibility} km</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Índice UV</Text>
          <Text style={styles.detailValue}>{weatherInfo.uvIndex}</Text>
        </View>
        
        {weatherInfo.precipitation > 0 && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Precipitación</Text>
            <Text style={styles.detailValue}>{weatherInfo.precipitation} mm</Text>
          </View>
        )}
        
        {weatherInfo.gustSpeed > 0 && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Ráfagas</Text>
            <Text style={styles.detailValue}>{weatherInfo.gustSpeed} km/h</Text>
          </View>
        )}
      </View>
      
      {/* Información adicional de ubicación */}
      <View style={styles.locationDetails}>
        <Text style={styles.locationDetailText}>
          {location?.region && `${location.region}, `}{location?.country || ''}
        </Text>
        <Text style={styles.locationDetailText}>
          Hora local: {localTime}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  locationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  countryText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  temperatureContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  tempAndIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  temperature: {
    fontSize: 72,
    fontWeight: '200',
    color: '#fff',
    textAlign: 'center',
  },
  weatherIcon: {
    width: 80,
    height: 80,
    marginLeft: 15,
  },
  condition: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 5,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  locationDetails: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  locationDetailText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 5,
  },
});