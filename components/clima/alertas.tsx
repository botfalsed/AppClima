import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertConfig, fetchCurrentWeather, WeatherData, getCurrentLocation } from '@/services/weatherApi';
import NotificationService, { NotificationSettings } from '@/services/notificationService';

export default function AlertasPersonalizadas() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    {
      id: 'temp_alta',
      type: 'temperature_high',
      enabled: false,
      value: 30,
      city: 'Madrid',
      message: ''
    },
    {
      id: 'temp_baja',
      type: 'temperature_low',
      enabled: false,
      value: 5,
      city: 'Madrid',
      message: ''
    },
    {
      id: 'lluvia',
      type: 'rain',
      enabled: false,
      value: 5,
      city: 'Madrid',
      message: ''
    },
    {
      id: 'viento',
      type: 'wind',
      enabled: false,
      value: 50,
      city: 'Madrid',
      message: ''
    },
    {
      id: 'uv',
      type: 'uv',
      enabled: false,
      value: 8,
      city: 'Madrid',
      message: ''
    },
    {
      id: 'air_quality',
      type: 'air_quality',
      enabled: false,
      value: 3,
      city: 'Madrid',
      message: ''
    }
  ]);

  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [currentCity, setCurrentCity] = useState('Madrid');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    vibration: true,
    checkInterval: 30,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
    categories: {
      weather: true,
      temperature: true,
      rain: true,
      wind: true,
      uv: true,
      airQuality: true,
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
    loadNotificationSettings();
    loadCurrentWeather();
    initializeNotificationService();
  }, []);

  useEffect(() => {
    loadCurrentWeather();
  }, [useCurrentLocation, currentCity]);

  const initializeNotificationService = async () => {
    const notificationService = NotificationService.getInstance();
    await notificationService.initialize();
  };

  const loadAlerts = async () => {
    try {
      const savedAlerts = await AsyncStorage.getItem('userAlerts');
      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts));
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const notificationService = NotificationService.getInstance();
      const settings = notificationService.getSettings();
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const loadCurrentWeather = async () => {
    try {
      setIsLoading(true);
      let weather: WeatherData;
      let locationName = 'Madrid';

      if (useCurrentLocation) {
        try {
          const currentLocation = await getCurrentLocation();
          if (currentLocation) {
            weather = await fetchCurrentWeather(`${currentLocation.latitude},${currentLocation.longitude}`);
            locationName = currentLocation.city || weather.location.name || 'Ubicación actual';
          } else {
            throw new Error('No se pudo obtener la ubicación actual');
          }
        } catch (locationError) {
          console.warn('Could not get current location, using default city:', locationError);
          weather = await fetchCurrentWeather('Madrid');
          locationName = 'Madrid';
        }
      } else {
        weather = await fetchCurrentWeather(currentCity);
        locationName = currentCity;
      }

      setCurrentWeather(weather);
      setCurrentCity(locationName);
    } catch (error) {
      console.error('Error loading current weather:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAlert = (id: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const updateAlertValue = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === id ? { ...alert, value: numValue } : alert
      )
    );
  };

  const updateAlertCity = (id: string, city: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === id ? { ...alert, city } : alert
      )
    );
  };

  const updateAlertMessage = (id: string, message: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === id ? { ...alert, message } : alert
      )
    );
  };

  const saveAlerts = async () => {
    try {
      await AsyncStorage.setItem('userAlerts', JSON.stringify(alerts));
      Alert.alert(
        'Configuración guardada',
        'Tus alertas han sido configuradas correctamente. Recibirás notificaciones cuando se cumplan las condiciones.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving alerts:', error);
      Alert.alert('Error', 'No se pudieron guardar las alertas');
    }
  };

  const testAlert = async (alert: AlertConfig) => {
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.sendTestNotification();
    } catch (error) {
      console.error('Error testing alert:', error);
    }
  };

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...notificationSettings, ...newSettings };
    setNotificationSettings(updatedSettings);
    const notificationService = NotificationService.getInstance();
    await notificationService.updateSettings(updatedSettings);
  };

  const toggleLocationMode = () => {
    setUseCurrentLocation(prev => !prev);
  };

  const getAlertIcon = (type: AlertConfig['type']) => {
    switch (type) {
      case 'temperature_high': return 'thermometer.sun.fill';
      case 'temperature_low': return 'thermometer.snowflake';
      case 'rain': return 'cloud.rain.fill';
      case 'wind': return 'wind';
      case 'uv': return 'sun.max.fill';
      case 'air_quality': return 'aqi.medium';
      default: return 'bell.fill';
    }
  };

  const getAlertTitle = (type: AlertConfig['type']) => {
    switch (type) {
      case 'temperature_high': return 'Temperatura Alta';
      case 'temperature_low': return 'Temperatura Baja';
      case 'rain': return 'Lluvia';
      case 'wind': return 'Viento Fuerte';
      case 'uv': return 'Índice UV Alto';
      case 'air_quality': return 'Calidad del Aire';
      default: return 'Alerta';
    }
  };

  const getAlertColor = (type: AlertConfig['type']) => {
    switch (type) {
      case 'temperature_high': return '#FF6B6B';
      case 'temperature_low': return '#4ECDC4';
      case 'rain': return '#6BCF7F';
      case 'wind': return '#9C88FF';
      case 'uv': return '#FFD700';
      case 'air_quality': return '#FF8C42';
      default: return '#6c757d';
    }
  };

  const getAlertUnit = (type: AlertConfig['type']) => {
    switch (type) {
      case 'temperature_high':
      case 'temperature_low': return '°C';
      case 'rain': return 'mm';
      case 'wind': return 'km/h';
      case 'uv': return '';
      case 'air_quality': return '';
      default: return '';
    }
  };

  const getCurrentValue = (type: AlertConfig['type']) => {
    if (!currentWeather) return 'N/A';
    
    switch (type) {
      case 'temperature_high':
      case 'temperature_low': 
        return `${currentWeather.current.temp_c}°C`;
      case 'rain': 
        return `${currentWeather.current.precip_mm}mm`;
      case 'wind': 
        return `${currentWeather.current.wind_kph}km/h`;
      case 'uv': 
        return currentWeather.current.uv.toString();
      case 'air_quality': 
        return currentWeather.current.air_quality ? 
          currentWeather.current.air_quality['us-epa-index'].toString() : 'N/A';
      default: 
        return 'N/A';
    }
  };

  const getAlertDescription = (type: AlertConfig['type']) => {
    switch (type) {
      case 'temperature_high': return 'Alerta cuando la temperatura supere';
      case 'temperature_low': return 'Alerta cuando la temperatura baje de';
      case 'rain': return 'Alerta cuando la precipitación supere';
      case 'wind': return 'Alerta cuando el viento supere';
      case 'uv': return 'Alerta cuando el índice UV supere';
      case 'air_quality': return 'Alerta cuando la calidad del aire supere';
      default: return 'Configurar alerta para';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconSymbol size={32} name="bell.fill" color="#FF6B6B" />
        <Text style={styles.title}>Alertas Personalizadas</Text>
        <Text style={styles.subtitle}>Configura notificaciones inteligentes</Text>
      </View>

      {/* Current Weather Summary */}
      {currentWeather && (
        <View style={styles.currentWeatherCard}>
          <Text style={styles.currentWeatherTitle}>Condiciones Actuales - {currentWeather.location.name}</Text>
          <View style={styles.currentWeatherGrid}>
            <View style={styles.currentWeatherItem}>
              <IconSymbol name="thermometer.medium" size={20} color="#FF6B6B" />
              <Text style={styles.currentWeatherValue}>{currentWeather.current.temp_c}°C</Text>
            </View>
            <View style={styles.currentWeatherItem}>
              <IconSymbol name="cloud.rain.fill" size={20} color="#4A90E2" />
              <Text style={styles.currentWeatherValue}>{currentWeather.current.precip_mm}mm</Text>
            </View>
            <View style={styles.currentWeatherItem}>
              <IconSymbol name="wind" size={20} color="#50C878" />
              <Text style={styles.currentWeatherValue}>{currentWeather.current.wind_kph}km/h</Text>
            </View>
            <View style={styles.currentWeatherItem}>
              <IconSymbol name="sun.max.fill" size={20} color="#FFD700" />
              <Text style={styles.currentWeatherValue}>UV {currentWeather.current.uv}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Location Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Configuración de Ubicación</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Usar ubicación actual</Text>
            <Text style={styles.settingDescription}>
              {useCurrentLocation ? 'Detectando automáticamente tu ubicación' : 'Usando ciudad seleccionada'}
            </Text>
          </View>
          <Switch
            value={useCurrentLocation}
            onValueChange={toggleLocationMode}
            trackColor={{ false: '#e9ecef', true: '#4A90E240' }}
            thumbColor={useCurrentLocation ? '#4A90E2' : '#6c757d'}
          />
        </View>

        {!useCurrentLocation && (
          <View style={styles.cityInputContainer}>
            <Text style={styles.inputLabel}>Ciudad:</Text>
            <TextInput
              style={styles.cityInput}
              value={currentCity}
              onChangeText={setCurrentCity}
              placeholder="Ingresa el nombre de la ciudad"
              placeholderTextColor="#6c757d"
            />
          </View>
        )}
      </View>

      {/* Notification Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Configuración de Notificaciones</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Activar notificaciones</Text>
          <Switch
            value={notificationSettings.enabled}
            onValueChange={(value) => updateNotificationSettings({ enabled: value })}
            trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
            thumbColor={notificationSettings.enabled ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Intervalo de verificación (min)</Text>
          <TextInput
            style={styles.intervalInput}
            value={notificationSettings.checkInterval.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 30;
              updateNotificationSettings({ checkInterval: value });
            }}
            keyboardType="numeric"
            placeholder="30"
          />
        </View>
      </View>

      <View style={styles.alertsList}>
        {alerts.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
                <IconSymbol size={24} name={getAlertIcon(alert.type)} color={getAlertColor(alert.type)} />
              </View>
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>{getAlertTitle(alert.type)}</Text>
                <Text style={styles.alertDescription}>{getAlertDescription(alert.type)}</Text>
                <Text style={styles.currentValueText}>Actual: {getCurrentValue(alert.type)}</Text>
              </View>
              <Switch
                value={alert.enabled}
                onValueChange={() => toggleAlert(alert.id)}
                trackColor={{ false: '#e9ecef', true: getAlertColor(alert.type) + '40' }}
                thumbColor={alert.enabled ? getAlertColor(alert.type) : '#f4f3f4'}
              />
            </View>

            {alert.enabled && (
              <View style={styles.alertConfig}>
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Ciudad:</Text>
                  <TextInput
                    style={styles.cityInput}
                    value={alert.city}
                    onChangeText={(text) => updateAlertCity(alert.id, text)}
                    placeholder="Nombre de la ciudad"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.configLabel}>Valor límite:</Text>
                  <View style={styles.valueInputContainer}>
                    <TextInput
                      style={styles.input}
                      value={alert.value.toString()}
                      onChangeText={(value) => updateAlertValue(alert.id, value)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                    <Text style={styles.unit}>{getAlertUnit(alert.type)}</Text>
                  </View>
                </View>

                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Mensaje personalizado:</Text>
                  <TextInput
                    style={styles.messageInput}
                    value={alert.message}
                    onChangeText={(text) => updateAlertMessage(alert.id, text)}
                    placeholder="Mensaje opcional para la notificación"
                    multiline
                  />
                </View>

                <TouchableOpacity
                  style={[styles.testButton, { backgroundColor: getAlertColor(alert.type) }]}
                  onPress={() => testAlert(alert)}
                >
                  <IconSymbol name="bell.badge.fill" size={16} color="#FFFFFF" />
                  <Text style={styles.testButtonText}>Probar Alerta</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveAlerts}>
        <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
        <Text style={styles.saveButtonText}>Guardar Configuración</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <IconSymbol size={20} name="info.circle" color="#6c757d" />
        <Text style={styles.infoText}>
          Las alertas se verifican automáticamente según el intervalo configurado. 
          Recibirás notificaciones cuando las condiciones climáticas superen los valores establecidos.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  currentWeatherCard: {
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
  currentWeatherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  currentWeatherGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  currentWeatherItem: {
    alignItems: 'center',
  },
  currentWeatherValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
  },
  alertsList: {
    padding: 16,
    paddingTop: 0,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  currentValueText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  alertConfig: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  configRow: {
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 6,
  },
  cityInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
  },
  cityInputContainer: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 6,
    fontWeight: '500',
  },
  settingInfo: {
    flex: 1,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: 12,
  },
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  unit: {
    fontSize: 16,
    color: '#6c757d',
    marginLeft: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  saveButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e9ecef',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 12,
    lineHeight: 20,
  },
});