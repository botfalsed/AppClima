import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fetchWeatherByCoordinates, fetchAutoWeather } from '@/services/weatherApi';
import GeolocationService from '@/services/geolocationService';

interface ThermalComfortData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  heatIndex: number;
  windChill: number;
  dewPoint: number;
  comfortLevel: 'muy_frio' | 'frio' | 'fresco' | 'comodo' | 'calido' | 'caluroso' | 'muy_caluroso';
  recommendations: string[];
}

interface ErrorState {
  hasError: boolean;
  message: string;
  type: 'network' | 'location' | 'data' | 'unknown';
}

export default function SensacionTermica() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>({ hasError: false, message: '', type: 'unknown' });
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [currentCity, setCurrentCity] = useState('Pucallpa');
  const [thermalData, setThermalData] = useState<ThermalComfortData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const geolocationService = GeolocationService.getInstance();

  const loadThermalData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      if (!isMountedRef.current) return;
      
      setLoading(true);
      setError({ hasError: false, message: '', type: 'unknown' });

      let weatherData;
      
      if (useCurrentLocation) {
        weatherData = await fetchAutoWeather();
        if (weatherData.location && isMountedRef.current) {
          setCurrentCity(weatherData.location.name);
        }
      } else {
        weatherData = await fetchAutoWeather();
      }

      if (weatherData && isMountedRef.current) {
        const thermal = calculateThermalComfort(weatherData.current);
        setThermalData(thermal);
        setLastUpdated(new Date());
        setRetryCount(0);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      
      console.error('Error loading thermal data:', err);
      
      let errorState: ErrorState;
      
      if (err.name === 'AbortError') {
        return;
      } else if (err.message?.includes('Network') || err.message?.includes('fetch')) {
        errorState = {
          hasError: true,
          message: 'Error de conexión. Verifica tu conexión a internet.',
          type: 'network'
        };
        
        // Retry automático para errores de red con backoff exponencial
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => {
            if (isMountedRef.current) {
              setRetryCount(prev => prev + 1);
              loadThermalData();
            }
          }, delay);
          return;
        }
      } else if (err.message?.includes('location') || err.message?.includes('geolocation')) {
        errorState = {
          hasError: true,
          message: 'No se pudo obtener la ubicación. Verifica los permisos de ubicación.',
          type: 'location'
        };
      } else if (err.message?.includes('data') || err.message?.includes('parse')) {
        errorState = {
          hasError: true,
          message: 'Error al procesar los datos meteorológicos.',
          type: 'data'
        };
      } else {
        errorState = {
          hasError: true,
          message: 'No se pudieron cargar los datos de sensación térmica',
          type: 'unknown'
        };
      }
      
      setError(errorState);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [useCurrentLocation, retryCount]);

  // Efecto con debounce para evitar llamadas excesivas
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadThermalData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [loadThermalData]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const toggleLocationMode = useCallback(() => {
    setUseCurrentLocation(prev => !prev);
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    loadThermalData();
  }, [loadThermalData]);

  const calculateThermalComfort = (current: any): ThermalComfortData => {
    const temp = current.temp_c;
    const humidity = current.humidity;
    const windSpeed = current.wind_kph;
    const feelsLike = current.feelslike_c;

    // Calcular índice de calor (Heat Index)
    const heatIndex = calculateHeatIndex(temp, humidity);
    
    // Calcular sensación de frío por viento (Wind Chill)
    const windChill = calculateWindChill(temp, windSpeed);
    
    // Calcular punto de rocío
    const dewPoint = calculateDewPoint(temp, humidity);
    
    // Determinar nivel de confort
    const comfortLevel = getComfortLevel(feelsLike);
    
    // Generar recomendaciones
    const recommendations = generateRecommendations(temp, feelsLike, humidity, windSpeed, comfortLevel);

    return {
      temperature: temp,
      feelsLike,
      humidity,
      windSpeed,
      heatIndex,
      windChill,
      dewPoint,
      comfortLevel,
      recommendations,
    };
  };

  const calculateHeatIndex = (temp: number, humidity: number): number => {
    if (temp < 27) return temp; // Heat index solo aplica para temperaturas altas
    
    const T = temp;
    const RH = humidity;
    
    const HI = -8.78469475556 +
               1.61139411 * T +
               2.33854883889 * RH +
               -0.14611605 * T * RH +
               -0.012308094 * T * T +
               -0.0164248277778 * RH * RH +
               0.002211732 * T * T * RH +
               0.00072546 * T * RH * RH +
               -0.000003582 * T * T * RH * RH;
    
    return Math.round(HI * 10) / 10;
  };

  const calculateWindChill = (temp: number, windSpeed: number): number => {
    if (temp > 10 || windSpeed < 4.8) return temp; // Wind chill solo aplica para temperaturas bajas y viento
    
    const T = temp;
    const V = windSpeed;
    
    const WC = 13.12 + 0.6215 * T - 11.37 * Math.pow(V, 0.16) + 0.3965 * T * Math.pow(V, 0.16);
    
    return Math.round(WC * 10) / 10;
  };

  const calculateDewPoint = (temp: number, humidity: number): number => {
    const a = 17.27;
    const b = 237.7;
    
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    
    return Math.round(dewPoint * 10) / 10;
  };

  const getComfortLevel = (feelsLike: number): ThermalComfortData['comfortLevel'] => {
    if (feelsLike < 0) return 'muy_frio';
    if (feelsLike < 10) return 'frio';
    if (feelsLike < 18) return 'fresco';
    if (feelsLike < 24) return 'comodo';
    if (feelsLike < 30) return 'calido';
    if (feelsLike < 35) return 'caluroso';
    return 'muy_caluroso';
  };

  const generateRecommendations = (
    temp: number,
    feelsLike: number,
    humidity: number,
    windSpeed: number,
    comfortLevel: ThermalComfortData['comfortLevel']
  ): string[] => {
    const recommendations: string[] = [];

    // Recomendaciones basadas en nivel de confort
    switch (comfortLevel) {
      case 'muy_frio':
        recommendations.push('Usa múltiples capas de ropa abrigada');
        recommendations.push('Protege extremidades del frío');
        recommendations.push('Limita el tiempo al aire libre');
        break;
      case 'frio':
        recommendations.push('Viste ropa abrigada y usa abrigo');
        recommendations.push('Usa guantes y gorro si es necesario');
        break;
      case 'fresco':
        recommendations.push('Usa ropa de manga larga o suéter ligero');
        recommendations.push('Perfecto para actividades al aire libre');
        break;
      case 'comodo':
        recommendations.push('Condiciones ideales para cualquier actividad');
        recommendations.push('Ropa ligera y cómoda es suficiente');
        break;
      case 'calido':
        recommendations.push('Usa ropa ligera y transpirable');
        recommendations.push('Mantente hidratado');
        break;
      case 'caluroso':
        recommendations.push('Evita la exposición prolongada al sol');
        recommendations.push('Bebe agua frecuentemente');
        recommendations.push('Busca sombra durante actividades');
        break;
      case 'muy_caluroso':
        recommendations.push('Limita las actividades al aire libre');
        recommendations.push('Mantente en lugares con aire acondicionado');
        recommendations.push('Hidratación constante es crucial');
        break;
    }

    // Recomendaciones adicionales basadas en condiciones específicas
    if (humidity > 70) {
      recommendations.push('Alta humedad: la sensación de calor se intensifica');
    }
    
    if (windSpeed > 20) {
      recommendations.push('Viento fuerte: puede aumentar la sensación de frío');
    }
    
    if (Math.abs(temp - feelsLike) > 5) {
      recommendations.push('Gran diferencia entre temperatura real y percibida');
    }

    return recommendations;
  };

  const getComfortColor = (level: ThermalComfortData['comfortLevel']): string => {
    switch (level) {
      case 'muy_frio': return '#1E3A8A';
      case 'frio': return '#3B82F6';
      case 'fresco': return '#06B6D4';
      case 'comodo': return '#10B981';
      case 'calido': return '#F59E0B';
      case 'caluroso': return '#EF4444';
      case 'muy_caluroso': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getComfortLabel = (level: ThermalComfortData['comfortLevel']): string => {
    switch (level) {
      case 'muy_frio': return 'Muy Frío';
      case 'frio': return 'Frío';
      case 'fresco': return 'Fresco';
      case 'comodo': return 'Cómodo';
      case 'calido': return 'Cálido';
      case 'caluroso': return 'Caluroso';
      case 'muy_caluroso': return 'Muy Caluroso';
      default: return 'Desconocido';
    }
  };

  const getComfortIcon = (level: ThermalComfortData['comfortLevel']): string => {
    switch (level) {
      case 'muy_frio': return 'snow';
      case 'frio': return 'thermometer.low';
      case 'fresco': return 'wind';
      case 'comodo': return 'checkmark.circle.fill';
      case 'calido': return 'thermometer.medium';
      case 'caluroso': return 'thermometer.high';
      case 'muy_caluroso': return 'flame.fill';
      default: return 'thermometer';
    }
  };

  // Memoización de datos calculados para optimizar re-renders
  const thermalSummary = useMemo(() => {
    if (!thermalData) return null;
    
    return {
      color: getComfortColor(thermalData.comfortLevel),
      label: getComfortLabel(thermalData.comfortLevel),
      icon: getComfortIcon(thermalData.comfortLevel),
      difference: Math.abs(thermalData.temperature - thermalData.feelsLike),
      isDifferenceSignificant: Math.abs(thermalData.temperature - thermalData.feelsLike) > 3
    };
  }, [thermalData]);

  const groupedRecommendations = useMemo(() => {
    if (!thermalData) return [];
    
    return thermalData.recommendations.map((rec, index) => ({
      id: index,
      text: rec,
      category: index < 3 ? 'primary' : 'secondary'
    }));
  }, [thermalData]);

  const thermalMetrics = useMemo(() => {
    if (!thermalData) return [];
    
    return [
      {
        id: 'heatIndex',
        label: 'Índice de Calor',
        value: `${thermalData.heatIndex.toFixed(1)}°C`,
        icon: 'thermometer.sun.fill',
        color: thermalData.heatIndex > 32 ? '#EF4444' : '#F59E0B'
      },
      {
        id: 'windChill',
        label: 'Sensación de Frío',
        value: `${thermalData.windChill.toFixed(1)}°C`,
        icon: 'wind.snow',
        color: thermalData.windChill < 10 ? '#3B82F6' : '#06B6D4'
      },
      {
        id: 'dewPoint',
        label: 'Punto de Rocío',
        value: `${thermalData.dewPoint.toFixed(1)}°C`,
        icon: 'drop.fill',
        color: '#10B981'
      }
    ];
  }, [thermalData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <IconSymbol name="thermometer" size={48} color="#4A90E2" />
        <Text style={styles.loadingText}>Calculando sensación térmica...</Text>
      </View>
    );
  }

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

  if (!thermalData || !thermalSummary) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No hay datos disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header con ubicación */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <IconSymbol name="location.fill" size={20} color="#4A90E2" />
            <Text style={styles.locationTitle}>Ubicación</Text>
          </View>
          
          <View style={styles.locationToggle}>
            <Text style={styles.locationText}>
              {useCurrentLocation ? 'Ubicación actual' : 'Ciudad por defecto'}
            </Text>
            <Switch
              value={useCurrentLocation}
              onValueChange={toggleLocationMode}
              trackColor={{ false: '#e9ecef', true: '#4A90E240' }}
              thumbColor={useCurrentLocation ? '#4A90E2' : '#6c757d'}
            />
          </View>
        </View>

        {/* Información principal de sensación térmica */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.locationInfo}>
              <IconSymbol name="location" size={16} color="#6c757d" />
              <Text style={styles.locationName}>{currentCity}</Text>
            </View>
            {lastUpdated && (
              <Text style={styles.lastUpdated}>
                Actualizado: {lastUpdated.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            )}
          </View>

          <View style={styles.thermalMainInfo}>
            <View style={styles.temperatureComparison}>
              <View style={styles.tempItem}>
                <Text style={styles.tempLabel}>Temperatura Real</Text>
                <Text style={styles.tempValue}>{thermalData.temperature}°C</Text>
              </View>
              <IconSymbol name="arrow.right" size={24} color="#6c757d" />
              <View style={styles.tempItem}>
                <Text style={styles.tempLabel}>Se Siente Como</Text>
                <Text style={[styles.tempValue, styles.feelsLikeValue]}>
                  {thermalData.feelsLike}°C
                </Text>
              </View>
            </View>

            <View style={[
              styles.comfortIndicator,
              { backgroundColor: thermalSummary.color }
            ]}>
              <IconSymbol 
                name={thermalSummary.icon} 
                size={32} 
                color="#fff" 
              />
              <Text style={styles.comfortLabel}>
                {thermalSummary.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Detalles de factores térmicos */}
        <View style={styles.factorsCard}>
          <Text style={styles.sectionTitle}>🌡️ Factores Térmicos</Text>
          
          <View style={styles.factorsGrid}>
            <View style={styles.factorItem}>
              <IconSymbol name="drop.fill" size={24} color="#4ECDC4" />
              <Text style={styles.factorLabel}>Humedad</Text>
              <Text style={styles.factorValue}>{thermalData.humidity}%</Text>
            </View>

            <View style={styles.factorItem}>
              <IconSymbol name="wind" size={24} color="#FFD93D" />
              <Text style={styles.factorLabel}>Viento</Text>
              <Text style={styles.factorValue}>{thermalData.windSpeed} km/h</Text>
            </View>

            {thermalMetrics.map((metric) => (
              <View key={metric.id} style={styles.factorItem}>
                <IconSymbol name={metric.icon} size={24} color={metric.color} />
                <Text style={styles.factorLabel}>{metric.label}</Text>
                <Text style={styles.factorValue}>{metric.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recomendaciones */}
        <View style={styles.recommendationsCard}>
          <Text style={styles.sectionTitle}>💡 Recomendaciones</Text>
          
          {groupedRecommendations.map((recommendation) => (
            <View key={recommendation.id} style={styles.recommendationItem}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#50C878" />
              <Text style={styles.recommendationText}>{recommendation.text}</Text>
            </View>
          ))}
        </View>

        {/* Información adicional */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>ℹ️ ¿Cómo se calcula?</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>Sensación Térmica</Text>
            <Text style={styles.infoDescription}>
              Combina temperatura, humedad y viento para calcular cómo percibe el cuerpo humano la temperatura.
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>Índice de Calor</Text>
            <Text style={styles.infoDescription}>
              Mide qué tan caliente se siente cuando se combina la temperatura con la humedad relativa.
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>Sensación de Frío</Text>
            <Text style={styles.infoDescription}>
              Calcula qué tan frío se siente la piel expuesta debido al viento.
            </Text>
          </View>
        </View>

        {/* Botón de actualización */}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRetry}>
          <IconSymbol name="arrow.clockwise" size={20} color="#4A90E2" />
          <Text style={styles.refreshButtonText}>Actualizar Datos</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationContainer: {
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
  mainCard: {
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
  cardHeader: {
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
    color: '#2c3e50',
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6c757d',
  },
  thermalMainInfo: {
    alignItems: 'center',
  },
  temperatureComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  tempItem: {
    alignItems: 'center',
  },
  tempLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  tempValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  feelsLikeValue: {
    color: '#4A90E2',
  },
  comfortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
  },
  comfortLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  factorsCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  factorItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  factorLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  factorValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  recommendationsCard: {
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
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    lineHeight: 20,
  },
  infoCard: {
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
  infoItem: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
});