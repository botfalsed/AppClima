import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fetchCurrentWeather, fetchUVForecast, WeatherData, UVData, getCurrentLocation } from '@/services/weatherApi';

// Interfaz para el estado de error
interface ErrorState {
  hasError: boolean;
  message: string;
  type: 'network' | 'location' | 'data' | 'unknown';
}

// Helper functions moved outside component
const getUVLevel = (uv: number): { level: string; color: string; description: string } => {
  if (uv <= 2) {
    return {
      level: 'Bajo',
      color: '#50C878',
      description: 'Mínimo riesgo. Puedes estar al aire libre sin protección.'
    };
  } else if (uv <= 5) {
    return {
      level: 'Moderado',
      color: '#FFD700',
      description: 'Riesgo moderado. Usa protector solar en exposiciones prolongadas.'
    };
  } else if (uv <= 7) {
    return {
      level: 'Alto',
      color: '#FFB347',
      description: 'Alto riesgo. Protección necesaria: protector solar, sombrero y gafas.'
    };
  } else if (uv <= 10) {
    return {
      level: 'Muy Alto',
      color: '#FF6B6B',
      description: 'Muy alto riesgo. Evita exposición 10:00-16:00. Protección máxima.'
    };
  } else {
    return {
      level: 'Extremo',
      color: '#8B008B',
      description: 'Riesgo extremo. Evita salir al aire libre. Protección total necesaria.'
    };
  }
};

const getProtectionRecommendations = (uv: number): string[] => {
  const recommendations: string[] = [];
  
  if (uv > 2) {
    recommendations.push('Usa protector solar SPF 30+');
  }
  if (uv > 5) {
    recommendations.push('Usa gafas de sol con protección UV');
    recommendations.push('Busca sombra entre 10:00-16:00');
  }
  if (uv > 7) {
    recommendations.push('Usa sombrero de ala ancha');
    recommendations.push('Viste ropa de manga larga');
    recommendations.push('Reaplica protector solar cada 2 horas');
  }
  if (uv > 10) {
    recommendations.push('Evita actividades al aire libre');
    recommendations.push('Permanece en interiores si es posible');
  }
  
  return recommendations;
};

const getSkinTypeAdvice = (uv: number): { [key: string]: string } => {
  return {
    'Piel Clara': uv > 3 ? 'Protección alta necesaria. Quemadura en 10-15 min.' : 'Protección básica recomendada',
    'Piel Media': uv > 5 ? 'Protección moderada necesaria. Quemadura en 15-20 min.' : 'Protección ligera recomendada',
    'Piel Oscura': uv > 7 ? 'Protección recomendada. Quemadura en 20-30 min.' : 'Protección mínima necesaria'
  };
};

const getUVIcon = (uv: number): string => {
  if (uv <= 2) return 'sun.min.fill';
  if (uv <= 5) return 'sun.max.fill';
  if (uv <= 7) return 'sun.max.fill';
  if (uv <= 10) return 'sun.max.fill';
  return 'exclamationmark.triangle.fill';
};

const formatTime = (time: string): string => {
  // Extract hour from time string (format: "2024-01-01 14:00" or "14:00")
  const hour = time.includes(' ') ? time.split(' ')[1].split(':')[0] : time.split(':')[0];
  return `${hour.padStart(2, '0')}:00`;
};

export default function IndiceUV() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [uvForecast, setUvForecast] = useState<UVData | null>(null);
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

  // Función optimizada para cargar datos UV con manejo de errores mejorado
  const loadUVData = useCallback(async () => {
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
      let location: string;

      if (useCurrentLocation) {
        try {
          const currentLocation = await getCurrentLocation();
          if (!isMountedRef.current) return;
          
          if (!currentLocation) {
            throw new Error('Could not get current location');
          }
          
          location = `${currentLocation.latitude},${currentLocation.longitude}`;
          weather = await fetchCurrentWeather(location);
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
        }
      } else {
        location = selectedCity;
        weather = await fetchCurrentWeather(selectedCity);
      }

      if (!isMountedRef.current) return;
      
      setWeatherData(weather);
      
      // Get UV forecast data
      const uvData = await fetchUVForecast(location);
      
      if (!isMountedRef.current) return;
      
      setUvForecast(uvData);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      console.error('Error loading UV data:', error);
      
      // Determinar tipo de error
      let errorType: ErrorState['type'] = 'unknown';
      let errorMessage = 'No se pudieron cargar los datos de índice UV';
      
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
        errorMessage = 'Error al procesar los datos UV.';
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
            loadUVData();
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
      loadUVData();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [loadUVData]);

  // Función optimizada para cambiar modo de ubicación
  const toggleLocationMode = useCallback(() => {
    setUseCurrentLocation(prev => !prev);
    setError({ hasError: false, message: '', type: 'unknown' });
  }, []);

  // Función para reintentar manualmente
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    loadUVData();
  }, [loadUVData]);

  // Memoizar datos computados para evitar re-renders innecesarios
  const currentUVData = useMemo(() => {
    if (!weatherData) return null;
    
    const uvInfo = getUVLevel(weatherData.current.uv);
    return {
      uvIndex: weatherData.current.uv,
      level: uvInfo.level,
      color: uvInfo.color,
      description: uvInfo.description
    };
  }, [weatherData]);

  // Memoizar pronóstico UV procesado
  const processedUVForecast = useMemo(() => {
    if (!uvForecast || !uvForecast.uv_forecast) return [];
    return uvForecast.uv_forecast.map(uvItem => {
      const uvInfo = getUVLevel(uvItem.uv);
      return {
        time: uvItem.time,
        uv: uvItem.uv,
        level: uvInfo.level,
        color: uvInfo.color,
        description: uvInfo.description
      };
    });
  }, [uvForecast]);

  // Memoizar recomendaciones de protección
  const protectionTips = useMemo(() => {
    if (!weatherData) return [];
    return getProtectionRecommendations(weatherData.current.uv);
  }, [weatherData]);

  // Memoizar consejos por tipo de piel
  const skinAdvice = useMemo(() => {
    if (!weatherData) return {};
    return getSkinTypeAdvice(weatherData.current.uv);
  }, [weatherData]);



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando datos UV...</Text>
      </View>
    );
  }

  // Mostrar error si hay uno
  if (error.hasError) {
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

  if (!weatherData || !currentUVData) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>No se pudieron cargar los datos UV</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentUV = currentUVData.uvIndex;
  const uvInfo = { level: currentUVData.level, color: currentUVData.color, description: currentUVData.description };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconSymbol size={32} name="sun.max.fill" color="#FFD700" />
        <Text style={styles.title}>Índice UV</Text>
        <Text style={styles.subtitle}>Protección solar inteligente</Text>
      </View>

      {/* Location Toggle */}
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <IconSymbol name="location.fill" size={20} color="#FFD700" />
          <Text style={styles.locationTitle}>Ubicación</Text>
        </View>
        <TouchableOpacity style={styles.locationToggle} onPress={toggleLocationMode}>
          <Text style={styles.locationText}>
            {useCurrentLocation ? 'Ubicación actual' : selectedCity}
          </Text>
          <IconSymbol 
            name={useCurrentLocation ? "location.fill" : "location"} 
            size={16} 
            color="#FFD700" 
          />
        </TouchableOpacity>
      </View>

      {/* Current UV Index */}
      <View style={styles.currentUVCard}>
        <View style={styles.uvHeader}>
          <View style={styles.locationInfo}>
            <IconSymbol name="location.fill" size={16} color="#6c757d" />
            <Text style={styles.locationName}>{weatherData.location.name}</Text>
          </View>
          <Text style={styles.lastUpdated}>
            Actualizado: {new Date(weatherData.location.localtime).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.uvMainInfo}>
          <View style={styles.uvIndexSection}>
            <View style={[styles.uvCircle, { backgroundColor: uvInfo.color }]}>
              <IconSymbol size={32} name={getUVIcon(currentUV)} color="#fff" />
              <Text style={styles.uvValue}>{currentUV}</Text>
            </View>
            <View style={styles.uvDetails}>
              <Text style={[styles.uvLevel, { color: uvInfo.color }]}>{uvInfo.level}</Text>
              <Text style={styles.uvDescription}>{uvInfo.description}</Text>
            </View>
          </View>
        </View>

        <View style={styles.additionalInfo}>
          <View style={styles.infoRow}>
            <IconSymbol name="clock.fill" size={16} color="#6c757d" />
            <Text style={styles.infoText}>
              Hora local: {new Date().toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol name="sun.max.fill" size={16} color="#FFD700" />
            <Text style={styles.infoText}>
              Máximo hoy: {processedUVForecast.length > 0 ? Math.max(...processedUVForecast.map(uv => uv.uv)) : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Hourly UV Forecast */}
      <View style={styles.forecastSection}>
        <Text style={styles.sectionTitle}>Pronóstico UV por Horas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
          {processedUVForecast.map((uvData, index) => (
            <View key={index} style={styles.hourlyCard}>
              <Text style={styles.hourlyTime}>{formatTime(uvData.time)}</Text>
              <View style={[styles.hourlyUVCircle, { backgroundColor: uvData.color }]}>
                <Text style={styles.hourlyUVValue}>{uvData.uv}</Text>
              </View>
              <Text style={[styles.hourlyLevel, { color: uvData.color }]}>
                {uvData.level}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Protection Recommendations */}
      <View style={styles.protectionSection}>
        <Text style={styles.sectionTitle}>Recomendaciones de Protección</Text>
        {protectionTips.map((tip, index) => (
          <View key={index} style={styles.protectionItem}>
            <IconSymbol name="shield.fill" size={16} color="#4A90E2" />
            <Text style={styles.protectionText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Skin Type Advice */}
      <View style={styles.skinTypeSection}>
        <Text style={styles.sectionTitle}>Consejos por Tipo de Piel</Text>
        {Object.entries(skinAdvice).map(([skinType, advice], index) => (
          <View key={index} style={styles.skinTypeCard}>
            <View style={styles.skinTypeHeader}>
              <IconSymbol name="person.fill" size={20} color="#FFB347" />
              <Text style={styles.skinTypeName}>{skinType}</Text>
            </View>
            <Text style={styles.skinTypeAdvice}>{advice}</Text>
          </View>
        ))}
      </View>

      {/* UV Safety Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Consejos de Seguridad UV</Text>
        
        <View style={styles.tipCard}>
          <IconSymbol name="clock.fill" size={20} color="#FF6B6B" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Horarios de Mayor Riesgo</Text>
            <Text style={styles.tipText}>
              Los rayos UV son más intensos entre las 10:00 y 16:00. Planifica actividades al aire libre fuera de estos horarios.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <IconSymbol name="drop.fill" size={20} color="#4A90E2" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Protector Solar</Text>
            <Text style={styles.tipText}>
              Aplica protector solar 30 minutos antes de salir. Reaplica cada 2 horas o después de nadar o sudar.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <IconSymbol name="eye.fill" size={20} color="#9C88FF" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Protección Ocular</Text>
            <Text style={styles.tipText}>
              Usa gafas de sol que bloqueen 99-100% de los rayos UVA y UVB. Los ojos también pueden sufrir daños por UV.
            </Text>
          </View>
        </View>

        {currentUV > 8 && (
          <View style={styles.alertCard}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#FF6B6B" />
            <View style={styles.tipContent}>
              <Text style={styles.alertTitle}>¡Alerta UV Extrema!</Text>
              <Text style={styles.alertText}>
                El índice UV es muy alto. Evita la exposición directa al sol y usa protección máxima si debes salir.
              </Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={handleRetry}>
        <IconSymbol size={20} name="arrow.clockwise" color="#fff" />
        <Text style={styles.refreshButtonText}>Actualizar Datos UV</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  locationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  currentUVCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  uvHeader: {
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
    color: '#ffffff',
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#cccccc',
  },
  uvMainInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  uvIndexSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uvCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  uvValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  uvDetails: {
    flex: 1,
  },
  uvLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  uvDescription: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
  forecastSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  hourlyScroll: {
    flexDirection: 'row',
  },
  hourlyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hourlyTime: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 8,
  },
  hourlyUVCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  hourlyUVValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  hourlyLevel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  protectionSection: {
    margin: 16,
    marginTop: 0,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  protectionText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  skinTypeSection: {
    margin: 16,
    marginTop: 0,
  },
  skinTypeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skinTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  skinTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  skinTypeAdvice: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  tipsSection: {
    margin: 16,
    marginTop: 0,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
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
    color: '#ffcccc',
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});