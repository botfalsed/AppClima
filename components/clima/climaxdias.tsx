import React, { useContext, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { WeatherContext } from '../../contexts/WeatherContext';

export default function ClimaXDias() {
  const { weatherData } = useContext(WeatherContext);

  // Memoizar los datos de pronóstico para evitar recálculos innecesarios
  const forecastDays = useMemo(() => {
    if (!weatherData?.forecast?.forecastday) {
      return [];
    }
    return weatherData.forecast.forecastday.slice(1); // Excluir el día actual
  }, [weatherData?.forecast?.forecastday]);

  // Optimizar la función formatDate con useCallback
  const formatDate = useCallback((dateString: string) => {
    try {
      // Parsear la fecha de manera más robusta
      const dateParts = dateString.split('-');
      if (dateParts.length !== 3) {
        return 'N/A';
      }
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Los meses en JS van de 0-11
      const day = parseInt(dateParts[2], 10);
      
      // Crear fecha usando constructor específico (más confiable en móviles)
      const date = new Date(year, month, day);
      
      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return days[date.getDay()];
    } catch (error) {
      console.log('Error formateando fecha:', error);
      return 'N/A';
    }
  }, []);

  // Optimizar la función formatDateDisplay con useCallback
  const formatDateDisplay = useCallback((dateString: string) => {
    try {
      // Parsear la fecha de manera más robusta
      const dateParts = dateString.split('-');
      if (dateParts.length !== 3) {
        return 'N/A';
      }
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Los meses en JS van de 0-11
      const day = parseInt(dateParts[2], 10);
      
      // Crear fecha usando constructor específico
      const date = new Date(year, month, day);
      
      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      // Formatear manualmente para evitar problemas de localización
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                     'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      return `${day} ${months[month]}`;
    } catch (error) {
      console.log('Error formateando fecha para mostrar:', error);
      return 'N/A';
    }
  }, []);

  // Memoizar los datos procesados del pronóstico
  const processedForecastData = useMemo(() => {
    return forecastDays.map((day, index) => ({
      key: `day-${index}-${day.date}`,
      dayName: index === 0 ? 'Mañana' : formatDate(day.date),
      dateDisplay: formatDateDisplay(day.date),
      iconUrl: `https:${day.day.condition.icon}`,
      maxTemp: Math.round(day.day.maxtemp_c),
      minTemp: Math.round(day.day.mintemp_c),
      avgTemp: Math.round(day.day.avgtemp_c),
      condition: day.day.condition.text,
      rainChance: day.day.daily_chance_of_rain,
      maxWind: Math.round(day.day.maxwind_kph),
      avgHumidity: day.day.avghumidity,
      uv: day.day.uv,
      sunrise: day.astro.sunrise,
      sunset: day.astro.sunset,
      moonPhase: day.astro.moon_phase
    }));
  }, [forecastDays, formatDate, formatDateDisplay]);

  if (forecastDays.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pronóstico de {processedForecastData.length} Días</Text>
      <View style={styles.forecastContainer}>
        {processedForecastData.map((dayData) => (
          <View key={dayData.key} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>
                {dayData.dayName}
              </Text>
              <Text style={styles.date}>
                {dayData.dateDisplay}
              </Text>
            </View>
            
            <View style={styles.weatherIconContainer}>
              <Image 
                source={{ uri: dayData.iconUrl }}
                style={styles.weatherIcon}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.temperatureContainer}>
              <Text style={styles.maxTemp}>
                {dayData.maxTemp}°
              </Text>
              <Text style={styles.minTemp}>
                {dayData.minTemp}°
              </Text>
              <Text style={styles.avgTemp}>
                Promedio: {dayData.avgTemp}°
              </Text>
            </View>
            
            <Text style={styles.condition}>
              {dayData.condition}
            </Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Lluvia</Text>
                <Text style={styles.detailValue}>💧 {dayData.rainChance}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Viento</Text>
                <Text style={styles.detailValue}>💨 {dayData.maxWind} km/h</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Humedad</Text>
                <Text style={styles.detailValue}>💧 {dayData.avgHumidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>UV</Text>
                <Text style={styles.detailValue}>☀️ {dayData.uv}</Text>
              </View>
            </View>
            
            {/* Información de astronomía */}
            <View style={styles.astroContainer}>
              <View style={styles.astroItem}>
                <Text style={styles.astroLabel}>🌅 Amanecer</Text>
                <Text style={styles.astroValue}>{dayData.sunrise}</Text>
              </View>
              <View style={styles.astroItem}>
                <Text style={styles.astroLabel}>🌇 Atardecer</Text>
                <Text style={styles.astroValue}>{dayData.sunset}</Text>
              </View>
              <View style={styles.astroItem}>
                <Text style={styles.astroLabel}>🌙 Fase lunar</Text>
                <Text style={styles.astroValue}>{dayData.moonPhase}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
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
  },
  forecastContainer: {
    gap: 15,
  },
  dayCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
  },
  weatherIconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherIcon: {
    width: 40,
    height: 40,
    marginBottom: 0,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  maxTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  minTemp: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.7,
    marginRight: 10,
  },
  avgTemp: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.6,
  },
  condition: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    width: '48%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '500',
  },
  astroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  astroItem: {
    flex: 1,
    alignItems: 'center',
  },
  astroLabel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 2,
  },
  astroValue: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '500',
  },
});

