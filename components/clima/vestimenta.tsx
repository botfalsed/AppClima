import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fetchCurrentWeather, getClothingRecommendations, WeatherData, ClothingRecommendation, getCurrentLocation } from '@/services/weatherApi';

// Interfaz para el estado de error
interface ErrorState {
  hasError: boolean;
  message: string;
  type: 'network' | 'location' | 'data' | 'unknown';
}

export default function RecomendacionesVestimenta() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [recommendations, setRecommendations] = useState<ClothingRecommendation[]>([]);
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

  // Función optimizada para cargar datos con manejo de errores mejorado
  const loadWeatherAndRecommendations = useCallback(async () => {
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

      if (useCurrentLocation) {
        try {
          const location = await getCurrentLocation();
          if (!isMountedRef.current) return;
          
          if (!location) {
            throw new Error('Could not get current location');
          }
          
          weather = await fetchCurrentWeather(`${location.latitude},${location.longitude}`);
        } catch (locationError) {
          console.warn('Could not get current location, using default city:', locationError);
          if (!isMountedRef.current) return;
          
          setError({
            hasError: true,
            message: 'No se pudo obtener la ubicación actual. Usando ciudad por defecto.',
            type: 'location'
          });
          
          weather = await fetchCurrentWeather(selectedCity);
        }
      } else {
        weather = await fetchCurrentWeather(selectedCity);
      }

      if (!isMountedRef.current) return;
      
      setWeatherData(weather);
      
      // Get clothing recommendations based on current weather
      const clothingRecs = await getClothingRecommendations(weather);
      
      if (!isMountedRef.current) return;
      
      setRecommendations(clothingRecs);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      console.error('Error loading weather data:', error);
      
      // Determinar tipo de error
      let errorType: ErrorState['type'] = 'unknown';
      let errorMessage = 'No se pudieron cargar las recomendaciones de vestimenta';
      
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
        errorMessage = 'Error al procesar los datos del clima.';
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
            loadWeatherAndRecommendations();
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
      loadWeatherAndRecommendations();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [loadWeatherAndRecommendations]);

  // Función optimizada para cambiar modo de ubicación
  const toggleLocationMode = useCallback(() => {
    setUseCurrentLocation(prev => !prev);
    setError({ hasError: false, message: '', type: 'unknown' });
  }, []);

  // Función para reintentar manualmente
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    loadWeatherAndRecommendations();
  }, [loadWeatherAndRecommendations]);

  // Memoizar datos computados para evitar re-renders innecesarios
  const weatherSummary = useMemo(() => {
    if (!weatherData) return null;
    
    return {
      temperature: weatherData.current.temp_c,
      condition: weatherData.current.condition.text,
      humidity: weatherData.current.humidity,
      windSpeed: weatherData.current.wind_kph,
      feelsLike: weatherData.current.feelslike_c,
      uvIndex: weatherData.current.uv
    };
  }, [weatherData]);

  // Memoizar recomendaciones agrupadas
  const groupedRecommendations = useMemo(() => {
    return recommendations.reduce((acc, rec) => {
      if (!acc[rec.category]) {
        acc[rec.category] = [];
      }
      acc[rec.category].push(rec);
      return acc;
    }, {} as Record<string, ClothingRecommendation[]>);
  }, [recommendations]);

  const getTemperatureAdvice = (temp: number): string => {
    if (temp < 0) return 'Temperatura extremadamente fría - Protección máxima necesaria';
    if (temp < 5) return 'Muy frío - Abrigo pesado recomendado';
    if (temp < 10) return 'Frío - Chaqueta de invierno necesaria';
    if (temp < 15) return 'Fresco - Suéter o chaqueta ligera';
    if (temp < 20) return 'Templado - Ropa de manga larga';
    if (temp < 25) return 'Agradable - Ropa ligera';
    if (temp < 30) return 'Cálido - Ropa fresca y transpirable';
    return 'Muy caluroso - Ropa muy ligera y protección solar';
  };

  const getComfortLevel = (temp: number, humidity: number, windSpeed: number): string => {
    const heatIndex = temp + (0.5 * (humidity - 50));
    const windChill = windSpeed > 5 ? temp - (windSpeed * 0.2) : temp;
    
    if (windChill < temp - 3) return 'Sensación de frío por viento';
    if (heatIndex > temp + 3) return 'Sensación de calor por humedad';
    return 'Condiciones confortables';
  };

  const getClothingIcon = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'abrigo': return 'tshirt.fill';
      case 'chaqueta': return 'tshirt.fill';
      case 'suéter': return 'tshirt.fill';
      case 'camiseta': return 'tshirt';
      case 'pantalones': return 'tshirt.fill';
      case 'shorts': return 'tshirt';
      case 'calzado': return 'shoe.fill';
      case 'accesorios': return 'eyeglasses';
      case 'protección': return 'shield.fill';
      default: return 'tshirt.fill';
    }
  };

  const getActivityRecommendations = (weather: WeatherData): string[] => {
    const temp = weather.current.temp_c;
    const condition = weather.current.condition.text.toLowerCase();
    const windSpeed = weather.current.wind_kph;
    const uv = weather.current.uv;
    
    const recommendations: string[] = [];
    
    if (condition.includes('rain') || condition.includes('lluvia')) {
      recommendations.push('Evita actividades al aire libre');
      recommendations.push('Perfecto para actividades en interiores');
    } else if (temp >= 15 && temp <= 25 && windSpeed < 20) {
      recommendations.push('Ideal para caminar o correr');
      recommendations.push('Perfecto para actividades al aire libre');
    } else if (temp > 25) {
      recommendations.push('Evita ejercicio intenso en las horas centrales');
      recommendations.push('Busca sombra para actividades prolongadas');
    } else if (temp < 10) {
      recommendations.push('Actividades de interior recomendadas');
      recommendations.push('Si sales, usa ropa térmica');
    }
    
    if (uv > 6) {
      recommendations.push('Usa protector solar SPF 30+');
      recommendations.push('Evita exposición directa 11:00-16:00');
    }
    
    return recommendations;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Cargando recomendaciones...</Text>
      </View>
    );
  }

  if (!weatherData) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>No se pudieron cargar los datos</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadWeatherAndRecommendations}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconSymbol size={32} name="tshirt.fill" color="#4A90E2" />
        <Text style={styles.title}>Recomendaciones de Vestimenta</Text>
        <Text style={styles.subtitle}>Vístete según el clima actual</Text>
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

      {/* Weather Summary */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <View style={styles.weatherLocation}>
            <IconSymbol name="location.fill" size={16} color="#6c757d" />
            <Text style={styles.locationName}>{weatherData.location.name}</Text>
          </View>
          <Text style={styles.lastUpdated}>
            Última actualización: {new Date(weatherData.location.localtime).toLocaleTimeString()}
          </Text>
        </View>
        
        <View style={styles.weatherSummary}>
          <View style={styles.tempSection}>
            <Text style={styles.temperature}>{weatherData.current.temp_c}°C</Text>
            <Text style={styles.condition}>{weatherData.current.condition.text}</Text>
            <Text style={styles.feelsLike}>Sensación: {weatherData.current.feelslike_c}°C</Text>
          </View>
          
          <View style={styles.weatherDetails}>
            <View style={styles.weatherDetail}>
              <IconSymbol name="humidity.fill" size={16} color="#4A90E2" />
              <Text style={styles.detailText}>{weatherData.current.humidity}%</Text>
            </View>
            <View style={styles.weatherDetail}>
              <IconSymbol name="wind" size={16} color="#50C878" />
              <Text style={styles.detailText}>{weatherData.current.wind_kph} km/h</Text>
            </View>
            <View style={styles.weatherDetail}>
              <IconSymbol name="sun.max.fill" size={16} color="#FFD700" />
              <Text style={styles.detailText}>UV {weatherData.current.uv}</Text>
            </View>
          </View>
        </View>

        <View style={styles.adviceSection}>
          <Text style={styles.adviceTitle}>Análisis de Confort</Text>
          <Text style={styles.adviceText}>
            {getTemperatureAdvice(weatherData.current.temp_c)}
          </Text>
          <Text style={styles.comfortText}>
            {getComfortLevel(weatherData.current.temp_c, weatherData.current.humidity, weatherData.current.wind_kph)}
          </Text>
        </View>
      </View>

      {/* Clothing Recommendations */}
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Recomendaciones de Vestimenta</Text>
        
        {recommendations.map((item, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <View style={styles.recommendationIcon}>
                <IconSymbol 
                  size={24} 
                  name={item.icon} 
                  color="#4A90E2" 
                />
              </View>
              <View style={styles.recommendationInfo}>
                <Text style={styles.recommendationCategory}>{item.category}</Text>
                <Text style={styles.recommendationItem}>{item.items.join(', ')}</Text>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={[
                  styles.priorityText,
                  { color: item.priority === 'high' ? '#FF6B6B' : 
                           item.priority === 'medium' ? '#FFB347' : '#50C878' }
                ]}>
                  {item.priority === 'high' ? 'Esencial' : 
                   item.priority === 'medium' ? 'Recomendado' : 'Opcional'}
                </Text>
              </View>
            </View>
            <Text style={styles.recommendationReason}>
              {item.priority === 'high' ? 'Recomendación esencial para las condiciones actuales' :
               item.priority === 'medium' ? 'Recomendación útil para mayor comodidad' :
               'Recomendación opcional para optimizar tu experiencia'}
            </Text>
          </View>
        ))}
      </View>

      {/* Activity Recommendations */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recomendaciones de Actividad</Text>
        {getActivityRecommendations(weatherData).map((recommendation, index) => (
          <View key={index} style={styles.activityItem}>
            <IconSymbol name="figure.walk" size={16} color="#50C878" />
            <Text style={styles.activityText}>{recommendation}</Text>
          </View>
        ))}
      </View>

      {/* Additional Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Consejos Adicionales</Text>
        
        <View style={styles.tipCard}>
          <IconSymbol name="lightbulb.fill" size={20} color="#FFB347" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Consejo del día</Text>
            <Text style={styles.tipText}>
              {weatherData.current.temp_c > 25 
                ? 'Mantente hidratado y busca sombra durante las horas más calurosas'
                : weatherData.current.temp_c < 10
                ? 'Vístete en capas para poder ajustar tu temperatura corporal'
                : 'Perfecto para actividades al aire libre, disfruta del buen clima'}
            </Text>
          </View>
        </View>

        {weatherData.current.uv > 3 && (
          <View style={styles.tipCard}>
            <IconSymbol name="sun.max.fill" size={20} color="#FF6B6B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Protección Solar</Text>
              <Text style={styles.tipText}>
                Índice UV alto ({weatherData.current.uv}). Usa protector solar, gafas de sol y sombrero.
              </Text>
            </View>
          </View>
        )}

        {weatherData.current.precip_mm > 0 && (
          <View style={styles.tipCard}>
            <IconSymbol name="umbrella.fill" size={20} color="#4A90E2" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Lluvia Detectada</Text>
              <Text style={styles.tipText}>
                Precipitación actual: {weatherData.current.precip_mm}mm. Lleva paraguas o impermeable.
              </Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadWeatherAndRecommendations}>
        <IconSymbol size={20} name="arrow.clockwise" color="#fff" />
        <Text style={styles.refreshButtonText}>Actualizar Recomendaciones</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6c757d',
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
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  locationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  weatherCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6c757d',
  },
  weatherSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tempSection: {
    alignItems: 'flex-start',
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  condition: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 4,
  },
  feelsLike: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  weatherDetails: {
    alignItems: 'flex-end',
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 6,
    fontWeight: '500',
  },
  adviceSection: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  adviceText: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 4,
    fontWeight: '500',
  },
  comfortText: {
    fontSize: 14,
    color: '#6c757d',
  },
  recommendationsSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationCategory: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  recommendationItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationReason: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  activitySection: {
    margin: 16,
    marginTop: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  tipsSection: {
    margin: 16,
    marginTop: 0,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#6c757d',
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