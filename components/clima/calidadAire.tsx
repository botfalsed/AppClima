import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fetchCurrentWeather, fetchAirQuality, WeatherData, AirQualityData, getCurrentLocation } from '@/services/weatherApi';

// Interfaz para el estado de error
interface ErrorState {
  hasError: boolean;
  message: string;
  type: 'network' | 'location' | 'data' | 'unknown';
}

// Helper functions moved outside component
const getAQILevel = (aqi: number): { level: string; color: string; description: string; healthAdvice: string } => {
  if (aqi <= 50) {
    return {
      level: 'Buena',
      color: '#50C878',
      description: 'La calidad del aire es satisfactoria',
      healthAdvice: 'Disfruta de actividades al aire libre'
    };
  } else if (aqi <= 100) {
    return {
      level: 'Moderada',
      color: '#FFD700',
      description: 'Calidad del aire aceptable para la mayoría',
      healthAdvice: 'Personas sensibles pueden experimentar síntomas menores'
    };
  } else if (aqi <= 150) {
    return {
      level: 'Insalubre para grupos sensibles',
      color: '#FFB347',
      description: 'Grupos sensibles pueden experimentar problemas',
      healthAdvice: 'Niños y adultos con problemas respiratorios deben limitar actividades prolongadas'
    };
  } else if (aqi <= 200) {
    return {
      level: 'Insalubre',
      color: '#FF6B6B',
      description: 'Todos pueden experimentar problemas de salud',
      healthAdvice: 'Evita actividades prolongadas al aire libre'
    };
  } else if (aqi <= 300) {
    return {
      level: 'Muy Insalubre',
      color: '#8B008B',
      description: 'Advertencia de salud: condiciones de emergencia',
      healthAdvice: 'Todos deben evitar actividades al aire libre'
    };
  } else {
    return {
      level: 'Peligrosa',
      color: '#800000',
      description: 'Alerta de salud: todos pueden experimentar efectos graves',
      healthAdvice: 'Permanece en interiores y evita cualquier actividad al aire libre'
    };
  }
};

const getPollutantLevel = (value: number, pollutant: string): { level: string; color: string } => {
  // Valores basados en estándares WHO/EPA
  const thresholds: { [key: string]: number[] } = {
    'pm2_5': [12, 35, 55, 150],
    'pm10': [20, 50, 100, 200],
    'o3': [100, 160, 240, 380],
    'no2': [40, 80, 180, 280],
    'so2': [20, 80, 250, 500],
    'co': [4400, 9400, 12400, 15400]
  };

  const levels = ['Bueno', 'Moderado', 'Insalubre para sensibles', 'Insalubre', 'Muy Insalubre'];
  const colors = ['#50C878', '#FFD700', '#FFB347', '#FF6B6B', '#8B008B'];

  const pollutantThresholds = thresholds[pollutant] || [50, 100, 150, 200];
  
  for (let i = 0; i < pollutantThresholds.length; i++) {
    if (value <= pollutantThresholds[i]) {
      return { level: levels[i], color: colors[i] };
    }
  }
  
  return { level: levels[4], color: colors[4] };
};

const getHealthRecommendations = (aqi: number): string[] => {
  const recommendations: string[] = [];
  
  if (aqi > 50) {
    recommendations.push('Considera usar mascarilla al aire libre');
  }
  if (aqi > 100) {
    recommendations.push('Limita actividades físicas intensas al aire libre');
    recommendations.push('Mantén ventanas cerradas');
  }
  if (aqi > 150) {
    recommendations.push('Evita ejercicio al aire libre');
    recommendations.push('Usa purificador de aire en interiores');
  }
  if (aqi > 200) {
    recommendations.push('Permanece en interiores tanto como sea posible');
    recommendations.push('Consulta a un médico si tienes síntomas respiratorios');
  }
  
  return recommendations;
};

const getAQIIcon = (aqi: number): string => {
  if (aqi <= 50) return 'leaf.fill';
  if (aqi <= 100) return 'cloud.fill';
  if (aqi <= 150) return 'smoke.fill';
  if (aqi <= 200) return 'exclamationmark.triangle.fill';
  return 'xmark.octagon.fill';
};

const formatPollutantValue = (value: number, unit: string): string => {
  return `${value.toFixed(1)} ${unit}`;
};

export default function CalidadAire() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Madrid');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [error, setError] = useState<ErrorState>({ hasError: false, message: '', type: 'unknown' });
  const [retryCount, setRetryCount] = useState(0);

  // Refs para evitar memory leaks
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Función optimizada para cargar datos de calidad del aire con manejo de errores mejorado
  const loadAirQualityData = useCallback(async () => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError({ hasError: false, message: '', type: 'unknown' });
      
      let weather: WeatherData;
      let airQuality: AirQualityData;
      let location: string;

      if (useCurrentLocation) {
        try {
          const currentLocation = await getCurrentLocation();
          if (!isMountedRef.current) return;
          
          if (!currentLocation) {
            throw new Error('No se pudo obtener la ubicación actual');
          }
          
          location = `${currentLocation.latitude},${currentLocation.longitude}`;
          weather = await fetchCurrentWeather(location);
          airQuality = await fetchAirQuality(location);
        } catch (locationError) {
          console.warn('Could not get current location, using default city:', locationError);
          if (!isMountedRef.current) return;
          
          setError({
            hasError: true,
            message: 'No se pudo obtener la ubicación actual. Usando ciudad por defecto.',
            type: 'location'
          });
          
          location = selectedCity;
          weather = await fetchCurrentWeather(selectedCity);
          airQuality = await fetchAirQuality(selectedCity);
        }
      } else {
        location = selectedCity;
        weather = await fetchCurrentWeather(selectedCity);
        airQuality = await fetchAirQuality(selectedCity);
      }

      if (!isMountedRef.current) return;
      
      setWeatherData(weather);
      setAirQualityData(airQuality);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      console.error('Error loading air quality data:', error);
      
      // Determinar tipo de error
      let errorType: ErrorState['type'] = 'unknown';
      let errorMessage = 'No se pudieron cargar los datos de calidad del aire';
      
      if (error.name === 'AbortError') {
        return; // Request was cancelled, don't show error
      }
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorType = 'network';
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.message?.includes('location')) {
        errorType = 'location';
        errorMessage = 'Error al obtener la ubicación.';
      } else if (error.message?.includes('data')) {
        errorType = 'data';
        errorMessage = 'Error al procesar los datos de calidad del aire.';
      }
      
      setError({
        hasError: true,
        message: errorMessage,
        type: errorType
      });
      
      // Auto-retry para errores de red (máximo 3 intentos)
      if (errorType === 'network' && retryCount < 3) {
        setTimeout(() => {
          if (isMountedRef.current) {
            setRetryCount(prev => prev + 1);
            loadAirQualityData();
          }
        }, 2000 * (retryCount + 1)); // Backoff exponencial
      }
      
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedCity, useCurrentLocation, retryCount]);

  // Efecto optimizado con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAirQualityData();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [loadAirQualityData]);

  // Función optimizada para cambiar modo de ubicación
  const toggleLocationMode = useCallback(() => {
    setUseCurrentLocation(prev => !prev);
    setError({ hasError: false, message: '', type: 'unknown' });
  }, []);

  // Función para reintentar manualmente
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    loadAirQualityData();
  }, [loadAirQualityData]);

  // Memoizar datos computados para evitar re-renders innecesarios
  const currentAQIData = useMemo(() => {
    if (!airQualityData) return null;
    
    const currentAQI = airQualityData['us-epa-index'] || airQualityData['gb-defra-index'] || 50;
    const aqiInfo = getAQILevel(currentAQI);
    
    return {
      aqi: currentAQI,
      level: aqiInfo.level,
      color: aqiInfo.color,
      description: aqiInfo.description,
      healthAdvice: aqiInfo.healthAdvice
    };
  }, [airQualityData]);

  // Memoizar recomendaciones de salud
  const healthRecommendations = useMemo(() => {
    if (!currentAQIData) return [];
    return getHealthRecommendations(currentAQIData.aqi);
  }, [currentAQIData]);

  // Memoizar datos de contaminantes procesados
  const pollutantsData = useMemo(() => {
    if (!airQualityData) return [];
    
    return [
      {
        name: 'PM2.5',
        value: airQualityData.pm2_5,
        unit: 'μg/m³',
        icon: 'circle.fill',
        ...getPollutantLevel(airQualityData.pm2_5, 'pm2_5')
      },
      {
        name: 'PM10',
        value: airQualityData.pm10,
        unit: 'μg/m³',
        icon: 'circle.fill',
        ...getPollutantLevel(airQualityData.pm10, 'pm10')
      },
      {
        name: 'O₃',
        value: airQualityData.o3,
        unit: 'μg/m³',
        icon: 'circle.fill',
        ...getPollutantLevel(airQualityData.o3, 'o3')
      },
      {
        name: 'NO₂',
        value: airQualityData.no2,
        unit: 'μg/m³',
        icon: 'circle.fill',
        ...getPollutantLevel(airQualityData.no2, 'no2')
      },
      {
        name: 'SO₂',
        value: airQualityData.so2,
        unit: 'μg/m³',
        icon: 'circle.fill',
        ...getPollutantLevel(airQualityData.so2, 'so2')
      },
      {
        name: 'CO',
        value: airQualityData.co,
        unit: 'μg/m³',
        icon: 'circle.fill',
        ...getPollutantLevel(airQualityData.co, 'co')
      }
    ];
  }, [airQualityData]);



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Cargando calidad del aire...</Text>
      </View>
    );
  }

  if (error.hasError && (!weatherData || !airQualityData)) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!weatherData || !airQualityData || !currentAQIData) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>No se pudieron cargar los datos de calidad del aire</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconSymbol size={32} name="leaf.fill" color="#4A90E2" />
        <Text style={styles.title}>Calidad del Aire</Text>
        <Text style={styles.subtitle}>Monitoreo de contaminación atmosférica</Text>
      </View>

      {/* Location Toggle */}
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <IconSymbol name="location.fill" size={20} color="#4A90E2" />
          <Text style={styles.locationTitle}>Ubicación</Text>
        </View>
        <TouchableOpacity style={styles.locationToggle} onPress={toggleLocationMode}>
          <Text style={styles.locationText}>
            {useCurrentLocation ? 'Ubicación actual' : selectedCity}
          </Text>
          <IconSymbol 
            name={useCurrentLocation ? "location.fill" : "location"} 
            size={16} 
            color="#4A90E2" 
          />
        </TouchableOpacity>
      </View>

      {/* Main AQI Card */}
      <View style={styles.mainAQICard}>
        <View style={styles.aqiHeader}>
          <View style={styles.locationInfo}>
            <IconSymbol name="location.fill" size={16} color="#6c757d" />
            <Text style={styles.locationName}>{weatherData.location.name}</Text>
          </View>
          <Text style={styles.lastUpdated}>
            Actualizado: {new Date().toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.aqiMainInfo}>
          <View style={styles.aqiIndexSection}>
            <View style={[styles.aqiCircle, { backgroundColor: currentAQIData.color }]}>
              <IconSymbol size={32} name={getAQIIcon(currentAQIData.aqi)} color="#fff" />
              <Text style={styles.aqiValue}>{currentAQIData.aqi}</Text>
            </View>
            <View style={styles.aqiDetails}>
              <Text style={[styles.aqiLevel, { color: currentAQIData.color }]}>{currentAQIData.level}</Text>
              <Text style={styles.aqiDescription}>{currentAQIData.description}</Text>
              <Text style={styles.healthAdvice}>{currentAQIData.healthAdvice}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pollutants Detail */}
      <View style={styles.pollutantsSection}>
        <Text style={styles.sectionTitle}>Contaminantes Principales</Text>
        
        <View style={styles.pollutantGrid}>
          {pollutantsData.map((pollutant, index) => (
            <View key={index} style={styles.pollutantCard}>
              <View style={styles.pollutantHeader}>
                <IconSymbol name={pollutant.icon} size={16} color={pollutant.color} />
                <Text style={styles.pollutantName}>{pollutant.name}</Text>
              </View>
              <Text style={styles.pollutantValue}>
                {formatPollutantValue(pollutant.value, pollutant.unit)}
              </Text>
              <Text style={[styles.pollutantLevel, { color: pollutant.color }]}>
                {pollutant.level}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Health Recommendations */}
      <View style={styles.healthSection}>
        <Text style={styles.sectionTitle}>Recomendaciones de Salud</Text>
        {healthRecommendations.map((recommendation, index) => (
          <View key={index} style={styles.healthItem}>
            <IconSymbol name="heart.fill" size={16} color="#FF6B6B" />
            <Text style={styles.healthText}>{recommendation}</Text>
          </View>
        ))}
      </View>

      {/* Pollutant Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Información sobre Contaminantes</Text>
        
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color="#4A90E2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>PM2.5 y PM10</Text>
            <Text style={styles.infoText}>
              Partículas en suspensión que pueden penetrar profundamente en los pulmones y causar problemas respiratorios.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color="#FFB347" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Ozono (O₃)</Text>
            <Text style={styles.infoText}>
              Gas que se forma por reacciones químicas en la atmósfera. Puede causar irritación respiratoria.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color="#9C88FF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Dióxido de Nitrógeno (NO₂)</Text>
            <Text style={styles.infoText}>
              Principalmente de vehículos y plantas de energía. Puede agravar el asma y reducir la función pulmonar.
            </Text>
          </View>
        </View>
      </View>

      {/* Protection Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Consejos de Protección</Text>
        
        <View style={styles.tipCard}>
          <IconSymbol name="house.fill" size={20} color="#50C878" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>En Interiores</Text>
            <Text style={styles.tipText}>
              Mantén ventanas cerradas durante días de alta contaminación. Usa purificadores de aire si es posible.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <IconSymbol name="figure.walk" size={20} color="#FFB347" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Actividad Física</Text>
            <Text style={styles.tipText}>
              Reduce ejercicio intenso al aire libre cuando la calidad del aire sea mala. Prefiere actividades en interiores.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <IconSymbol name="facemask.fill" size={20} color="#4A90E2" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Protección Personal</Text>
            <Text style={styles.tipText}>
              Considera usar mascarillas N95 en días de alta contaminación, especialmente si tienes condiciones respiratorias.
            </Text>
          </View>
        </View>

        {currentAQIData.aqi > 150 && (
          <View style={styles.alertCard}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#FF6B6B" />
            <View style={styles.tipContent}>
              <Text style={styles.alertTitle}>¡Alerta de Calidad del Aire!</Text>
              <Text style={styles.alertText}>
                La calidad del aire es insalubre. Limita las actividades al aire libre y considera permanecer en interiores.
              </Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={handleRetry}>
        <IconSymbol size={20} name="arrow.clockwise" color="#fff" />
        <Text style={styles.refreshButtonText}>Actualizar Calidad del Aire</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Changed to black to match explore theme
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Changed to black
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff', // Changed to white text
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Changed to black
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ffffff', // Changed to white text
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent black
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)', // Subtle white border
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff', // White text
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc', // Light gray text
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle border
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff', // White text
    marginLeft: 8,
  },
  locationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Very subtle background
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#ffffff', // White text
    fontWeight: '500',
  },
  mainAQICard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle border
  },
  aqiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff', // White text
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#cccccc', // Light gray text
  },
  aqiMainInfo: {
    alignItems: 'center',
  },
  aqiIndexSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aqiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  aqiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  aqiDetails: {
    flex: 1,
  },
  aqiLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aqiDescription: {
    fontSize: 14,
    color: '#cccccc', // Light gray text
    marginBottom: 4,
  },
  healthAdvice: {
    fontSize: 12,
    color: '#cccccc', // Light gray text
    fontStyle: 'italic',
  },
  pollutantsSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff', // White text
    marginBottom: 16,
  },
  pollutantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pollutantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle border
  },
  pollutantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollutantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff', // White text
    marginLeft: 6,
  },
  pollutantValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // White text
    marginBottom: 4,
  },
  pollutantLevel: {
    fontSize: 12,
    fontWeight: '500',
  },
  healthSection: {
    margin: 16,
    marginTop: 0,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border
  },
  healthText: {
    fontSize: 14,
    color: '#ffffff', // White text
    marginLeft: 8,
    flex: 1,
  },
  infoSection: {
    margin: 16,
    marginTop: 0,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle border
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff', // White text
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#cccccc', // Light gray text
    lineHeight: 20,
  },
  tipsSection: {
    margin: 16,
    marginTop: 0,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle border
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff', // White text
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#cccccc', // Light gray text
    lineHeight: 20,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 107, 0.2)', // Semi-transparent red background
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#ffcccc', // Light red text
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});