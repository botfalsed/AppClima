import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import NotificationService, { NotificationSettings, PushNotification } from '@/services/notificationService';
import { getCurrentLocation } from '@/services/weatherApi';

export default function ConfiguracionNotificaciones() {
  const [settings, setSettings] = useState<NotificationSettings>({
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

  const [loading, setLoading] = useState(true);
  const [showQuietHours, setShowQuietHours] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<PushNotification[]>([]);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [defaultCity, setDefaultCity] = useState('Madrid');
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [stats, setStats] = useState<{
    totalSent: number;
    todaySent: number;
    categoriesEnabled: number;
    lastSent?: number;
  }>({
    totalSent: 0,
    todaySent: 0,
    categoriesEnabled: 0,
    lastSent: undefined,
  });

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    loadSettings();
    loadStats();
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocationName(location.city || 'Ubicación actual');
      }
    } catch (error) {
      console.error('Error loading current location:', error);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      await notificationService.initialize();
      const currentSettings = notificationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'No se pudieron cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const notificationStats = await notificationService.getNotificationStats();
      setStats(notificationStats);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await notificationService.getNotificationHistory();
      setNotificationHistory(history);
    } catch (error) {
      console.error('Error loading notification history:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await notificationService.updateSettings(newSettings);
      await loadStats();
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'No se pudieron guardar las configuraciones');
    }
  };

  const sendTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Alert.alert('✅ Éxito', 'Notificación de prueba enviada');
      await loadStats();
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'No se pudo enviar la notificación de prueba');
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres borrar el historial de notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.clearNotificationHistory();
              setNotificationHistory([]);
              await loadStats();
              Alert.alert('✅ Éxito', 'Historial borrado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo borrar el historial');
            }
          },
        },
      ]
    );
  };

  const toggleLocationMode = () => {
    setUseCurrentLocation(prev => !prev);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'weather-alert':
        return 'cloud.fill';
      case 'temperature':
        return 'thermometer';
      case 'rain':
        return 'cloud.rain.fill';
      case 'wind':
        return 'wind';
      case 'uv':
        return 'sun.max.fill';
      case 'air-quality':
        return 'leaf.fill';
      default:
        return 'bell.fill';
    }
  };

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: string,
    color: string = '#4A90E2'
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e9ecef', true: color + '40' }}
        thumbColor={value ? color : '#6c757d'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <IconSymbol name="gear" size={48} color="#4A90E2" />
        <Text style={styles.loadingText}>Cargando configuraciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Configuración de Ubicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Configuración de Ubicación</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <IconSymbol name="location.fill" size={24} color="#4A90E2" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Usar ubicación actual</Text>
              <Text style={styles.settingDescription}>
                {useCurrentLocation 
                  ? `Detectando automáticamente: ${currentLocationName || 'Obteniendo ubicación...'}`
                  : `Usando ciudad seleccionada: ${defaultCity}`
                }
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
              <Text style={styles.inputLabel}>Ciudad por defecto:</Text>
              <TextInput
                style={styles.cityInput}
                value={defaultCity}
                onChangeText={setDefaultCity}
                placeholder="Ingresa el nombre de la ciudad"
                placeholderTextColor="#6c757d"
              />
              <Text style={styles.inputDescription}>
                Esta ciudad se usará para las notificaciones cuando no se pueda obtener la ubicación actual
              </Text>
            </View>
          )}
        </View>

        {/* Configuraciones Generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Configuración General</Text>
          
          {renderSettingItem(
            'Notificaciones Habilitadas',
            'Activar o desactivar todas las notificaciones',
            settings.enabled,
            (value) => updateSettings({ enabled: value }),
            'bell.fill',
            '#4A90E2'
          )}

          {settings.enabled && (
            <>
              {renderSettingItem(
                'Sonido',
                'Reproducir sonido con las notificaciones',
                settings.sound,
                (value) => updateSettings({ sound: value }),
                'speaker.wave.2.fill',
                '#50C878'
              )}

              {renderSettingItem(
                'Vibración',
                'Vibrar el dispositivo con las notificaciones',
                settings.vibration,
                (value) => updateSettings({ vibration: value }),
                'iphone.radiowaves.left.and.right',
                '#FF6B6B'
              )}
            </>
          )}
        </View>

        {/* Intervalo de Verificación */}
        {settings.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ Frecuencia de Verificación</Text>
            <View style={styles.intervalContainer}>
              <Text style={styles.intervalLabel}>Verificar cada:</Text>
              <View style={styles.intervalButtons}>
                {[15, 30, 60, 120].map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.intervalButton,
                      settings.checkInterval === minutes && styles.intervalButtonActive,
                    ]}
                    onPress={() => updateSettings({ checkInterval: minutes })}
                  >
                    <Text
                      style={[
                        styles.intervalButtonText,
                        settings.checkInterval === minutes && styles.intervalButtonTextActive,
                      ]}
                    >
                      {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Horas Silenciosas */}
        {settings.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌙 Horas Silenciosas</Text>
            
            {renderSettingItem(
              'Activar Horas Silenciosas',
              'No enviar notificaciones durante ciertas horas',
              settings.quietHours.enabled,
              (value) => updateSettings({ quietHours: { ...settings.quietHours, enabled: value } }),
              'moon.fill',
              '#9C88FF'
            )}

            {settings.quietHours.enabled && (
              <TouchableOpacity
                style={styles.quietHoursButton}
                onPress={() => setShowQuietHours(true)}
              >
                <IconSymbol name="clock.fill" size={20} color="#9C88FF" />
                <Text style={styles.quietHoursText}>
                  {settings.quietHours.start} - {settings.quietHours.end}
                </Text>
                <IconSymbol name="chevron.right" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Categorías de Notificaciones */}
        {settings.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📂 Categorías de Alertas</Text>
            
            {renderSettingItem(
              'Alertas Meteorológicas',
              'Condiciones climáticas generales',
              settings.categories.weather,
              (value) => updateSettings({ categories: { ...settings.categories, weather: value } }),
              'cloud.fill',
              '#4A90E2'
            )}

            {renderSettingItem(
              'Temperatura',
              'Alertas de temperatura alta o baja',
              settings.categories.temperature,
              (value) => updateSettings({ categories: { ...settings.categories, temperature: value } }),
              'thermometer',
              '#FF6B6B'
            )}

            {renderSettingItem(
              'Lluvia',
              'Alertas de precipitación',
              settings.categories.rain,
              (value) => updateSettings({ categories: { ...settings.categories, rain: value } }),
              'cloud.rain.fill',
              '#4ECDC4'
            )}

            {renderSettingItem(
              'Viento',
              'Alertas de viento fuerte',
              settings.categories.wind,
              (value) => updateSettings({ categories: { ...settings.categories, wind: value } }),
              'wind',
              '#FFD93D'
            )}

            {renderSettingItem(
              'Índice UV',
              'Alertas de radiación ultravioleta',
              settings.categories.uv,
              (value) => updateSettings({ categories: { ...settings.categories, uv: value } }),
              'sun.max.fill',
              '#FF8A65'
            )}

            {renderSettingItem(
              'Calidad del Aire',
              'Alertas de contaminación del aire',
              settings.categories.airQuality,
              (value) => updateSettings({ categories: { ...settings.categories, airQuality: value } }),
              'leaf.fill',
              '#6BCF7F'
            )}
          </View>
        )}

        {/* Estadísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estadísticas</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalSent}</Text>
              <Text style={styles.statLabel}>Total Enviadas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.todaySent}</Text>
              <Text style={styles.statLabel}>Hoy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.categoriesEnabled}</Text>
              <Text style={styles.statLabel}>Categorías Activas</Text>
            </View>
          </View>

          {stats.lastSent && (
            <Text style={styles.lastSentText}>
              Última notificación: {formatTime(stats.lastSent)}
            </Text>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Acciones</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={sendTestNotification}>
            <IconSymbol name="paperplane.fill" size={20} color="#4A90E2" />
            <Text style={styles.actionButtonText}>Enviar Notificación de Prueba</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              loadHistory();
              setShowHistory(true);
            }}
          >
            <IconSymbol name="clock.arrow.circlepath" size={20} color="#50C878" />
            <Text style={styles.actionButtonText}>Ver Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={clearHistory}>
            <IconSymbol name="trash.fill" size={20} color="#FF6B6B" />
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Borrar Historial</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Historial */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showHistory}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <IconSymbol name="xmark" size={24} color="#2c3e50" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Historial de Notificaciones</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.historyContainer}>
            {notificationHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <IconSymbol name="bell.slash" size={48} color="#adb5bd" />
                <Text style={styles.emptyHistoryText}>No hay notificaciones en el historial</Text>
              </View>
            ) : (
              notificationHistory.map((notification) => (
                <View key={notification.id} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <IconSymbol
                      name={getCategoryIcon(notification.category)}
                      size={20}
                      color="#4A90E2"
                    />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>{notification.title}</Text>
                    <Text style={styles.historyBody}>{notification.body}</Text>
                    <Text style={styles.historyTime}>{formatTime(notification.timestamp)}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(notification.priority) }]}>
                    <Text style={styles.priorityText}>{notification.priority.toUpperCase()}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#FF6B6B';
    case 'normal':
      return '#4A90E2';
    case 'low':
      return '#6c757d';
    default:
      return '#4A90E2';
  }
};

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
  scrollContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  intervalContainer: {
    paddingVertical: 8,
  },
  intervalLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 12,
  },
  intervalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  intervalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  intervalButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  intervalButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  intervalButtonTextActive: {
    color: '#fff',
  },
  quietHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
  },
  quietHoursText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#2c3e50',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  lastSentText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 4,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#fff5f5',
  },
  dangerButtonText: {
    color: '#FF6B6B',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  placeholder: {
    width: 24,
  },
  cityInputContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    fontWeight: '500',
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
  inputDescription: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 6,
    lineHeight: 16,
  },
  historyContainer: {
    flex: 1,
    padding: 16,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyHistoryText: {
    marginTop: 16,
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  historyBody: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#adb5bd',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});