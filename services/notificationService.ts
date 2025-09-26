import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { checkAlerts, AlertConfig } from './weatherApi';
import GeolocationService from './geolocationService';

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  checkInterval: number; // en minutos
  quietHours: {
    enabled: boolean;
    start: string; // formato HH:MM
    end: string; // formato HH:MM
  };
  categories: {
    weather: boolean;
    temperature: boolean;
    rain: boolean;
    wind: boolean;
    uv: boolean;
    airQuality: boolean;
  };
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: number;
  category: string;
  priority: 'low' | 'normal' | 'high';
}

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private lastAlertCheck: { [key: string]: number } = {};

  private constructor() {
    this.settings = {
      enabled: true,
      sound: true,
      vibration: true,
      checkInterval: 30, // 30 minutos por defecto
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
    };
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Inicializar el servicio de notificaciones
  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      await this.setupNotifications();
      
      if (this.settings.enabled) {
        await this.startPeriodicChecks();
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Configurar notificaciones de Expo
  private async setupNotifications(): Promise<void> {
    try {
      // Configurar el comportamiento de las notificaciones
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: this.settings.sound,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Solicitar permisos
      await this.requestPermissions();

      // Configurar categorías de notificaciones
      await this.setupNotificationCategories();

    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }

  // Solicitar permisos de notificaciones
  async requestPermissions(): Promise<boolean> {
    try {
      // En web, las notificaciones funcionan de manera diferente
      if (Platform.OS === 'web') {
        console.log('Web platform detected - using browser notifications');
        
        // Verificar si el navegador soporta notificaciones
        if (!('Notification' in window)) {
          console.warn('Este navegador no soporta notificaciones');
          return false;
        }

        // Solicitar permisos del navegador
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Browser notification permissions granted');
          return true;
        } else {
          console.warn('Browser notification permissions denied');
          return false;
        }
      }

      // Para dispositivos móviles nativos
      if (!Device.isDevice) {
        console.warn('Las notificaciones push solo funcionan en dispositivos físicos');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permisos de notificación denegados');
        return false;
      }

      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('weather-alerts', {
          name: 'Alertas Meteorológicas',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
          sound: 'default',
        });
      }

      console.log('Native notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Configurar categorías de notificaciones (solo iOS/Android)
  private async setupNotificationCategories(): Promise<void> {
    try {
      // Las categorías de notificaciones solo están disponibles en plataformas nativas
      if (Platform.OS === 'web') {
        console.log('Notification categories not available on web platform');
        return;
      }

      // Solo configurar categorías en dispositivos físicos
      if (!Device.isDevice) {
        console.log('Notification categories not available on simulator/emulator');
        return;
      }

      await Notifications.setNotificationCategoryAsync('weather-alert', [
        {
          identifier: 'view-details',
          buttonTitle: 'Ver Detalles',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Descartar',
          options: { isDestructive: true },
        },
      ]);
      
      console.log('Notification categories set up successfully');
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  }

  // Iniciar verificaciones periódicas
  async startPeriodicChecks(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.checkAndSendAlerts();
    }, this.settings.checkInterval * 60 * 1000);

    // Ejecutar una verificación inicial
    await this.checkAndSendAlerts();
  }

  // Detener verificaciones periódicas
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Verificar y enviar alertas
  private async checkAndSendAlerts(): Promise<void> {
    try {
      if (!this.settings.enabled || this.isQuietHours()) {
        return;
      }

      // Obtener alertas configuradas
      const alerts = await this.getStoredAlerts();
      
      for (const alert of alerts) {
        if (!this.shouldCheckAlert(alert)) {
          continue;
        }

        try {
          // Obtener ubicación si es necesario
          let location = null;
          if (alert.useCurrentLocation) {
            const geoService = GeolocationService.getInstance();
            location = await geoService.getCurrentLocation();
          }

          const city = location?.city || alert.city;
          if (!city) continue;

          const triggeredAlerts = await checkAlerts([{...alert, city}]);
          
          for (const triggeredAlert of triggeredAlerts) {
            await this.sendNotification({
              id: `alert-${alert.id}-${Date.now()}`,
              title: this.getAlertTitle(triggeredAlert.type),
              body: triggeredAlert.message || this.getDefaultAlertMessage(triggeredAlert.type, triggeredAlert.value),
              data: {
                alertType: triggeredAlert.type,
                city: city,
                value: triggeredAlert.value,
                alertId: alert.id,
              },
              timestamp: Date.now(),
              category: 'weather-alert',
              priority: this.getAlertPriority(triggeredAlert.type),
            });

            // Marcar como enviada para evitar duplicados
            this.lastAlertCheck[`${alert.id}-${triggeredAlert.type}`] = Date.now();
          }
        } catch (alertError) {
          console.error(`Error checking alert ${alert.id}:`, alertError);
        }
      }
    } catch (error) {
      console.error('Error in periodic alert check:', error);
    }
  }

  // Enviar notificación
  async sendNotification(notification: PushNotification): Promise<void> {
    try {
      if (!this.settings.enabled) {
        return;
      }

      // Verificar si la categoría está habilitada
      const categoryEnabled = this.isCategoryEnabled(notification.category);
      if (!categoryEnabled) {
        return;
      }

      // Verificar horas silenciosas
      if (this.isQuietHours()) {
        console.log('Notification skipped due to quiet hours');
        return;
      }

      // Enviar notificación según la plataforma
      if (Platform.OS === 'web') {
        // Usar notificaciones del navegador en web
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/icon.png', // Asegúrate de tener un icono en public/
            tag: notification.id,
            requireInteraction: notification.priority === 'high',
          });
          console.log('Browser notification sent:', notification.title);
        } else {
          console.warn('Browser notifications not available or permission denied');
        }
      } else {
        // Usar expo-notifications para móvil
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            categoryIdentifier: 'weather-alert',
            sound: this.settings.sound ? 'default' : undefined,
          },
          trigger: null, // Enviar inmediatamente
        });
        console.log('Native notification sent:', notification.title);
      }

      // Guardar en historial
      await this.saveNotificationToHistory(notification);

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Verificar si es hora silenciosa
  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = this.settings.quietHours.start;
    const end = this.settings.quietHours.end;

    // Si el período cruza medianoche
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  // Verificar si se debe revisar una alerta
  private shouldCheckAlert(alert: AlertConfig): boolean {
    const alertKey = `${alert.id}-${alert.type}`;
    const lastCheck = this.lastAlertCheck[alertKey];
    
    if (!lastCheck) {
      return true;
    }

    // Evitar spam de notificaciones (mínimo 1 hora entre alertas del mismo tipo)
    const timeSinceLastAlert = Date.now() - lastCheck;
    return timeSinceLastAlert > 60 * 60 * 1000; // 1 hora
  }

  // Verificar si una categoría está habilitada
  private isCategoryEnabled(category: string): boolean {
    switch (category) {
      case 'weather-alert':
        return this.settings.categories.weather;
      case 'temperature_high':
      case 'temperature_low':
        return this.settings.categories.temperature;
      case 'rain':
        return this.settings.categories.rain;
      case 'wind':
        return this.settings.categories.wind;
      case 'uv':
        return this.settings.categories.uv;
      case 'air_quality':
        return this.settings.categories.airQuality;
      default:
        return true;
    }
  }

  // Obtener prioridad de alerta
  private getAlertPriority(alertType: string): 'low' | 'normal' | 'high' {
    switch (alertType) {
      case 'temperature_high':
      case 'temperature_low':
      case 'rain':
        return 'high';
      case 'wind':
      case 'uv':
        return 'normal';
      case 'air_quality':
        return 'normal';
      default:
        return 'normal';
    }
  }

  // Obtener título de alerta
  private getAlertTitle(alertType: string): string {
    switch (alertType) {
      case 'temperature_high':
        return '🌡️ Alerta de Temperatura Alta';
      case 'temperature_low':
        return '🌡️ Alerta de Temperatura Baja';
      case 'rain':
        return '🌧️ Alerta de Lluvia';
      case 'wind':
        return '💨 Alerta de Viento';
      case 'uv':
        return '☀️ Alerta UV';
      case 'air_quality':
        return '🍃 Alerta de Calidad del Aire';
      default:
        return '🌤️ Alerta Meteorológica';
    }
  }

  // Obtener mensaje por defecto
  private getDefaultAlertMessage(alertType: string, value: any): string {
    switch (alertType) {
      case 'temperature_high':
        return `La temperatura actual es ${value}°C (muy alta)`;
      case 'temperature_low':
        return `La temperatura actual es ${value}°C (muy baja)`;
      case 'rain':
        return `Probabilidad de lluvia: ${value}%`;
      case 'wind':
        return `Velocidad del viento: ${value} km/h`;
      case 'uv':
        return `Índice UV: ${value}`;
      case 'air_quality':
        return `Calidad del aire: ${value}`;
      default:
        return 'Se ha activado una alerta meteorológica';
    }
  }

  // Obtener alertas almacenadas
  private async getStoredAlerts(): Promise<AlertConfig[]> {
    try {
      const stored = await AsyncStorage.getItem('weatherAlerts');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading stored alerts:', error);
      return [];
    }
  }

  // Guardar notificación en historial
  private async saveNotificationToHistory(notification: PushNotification): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      history.unshift(notification);
      
      // Mantener solo las últimas 50 notificaciones
      const trimmedHistory = history.slice(0, 50);
      
      await AsyncStorage.setItem('notificationHistory', JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving notification to history:', error);
    }
  }

  // Obtener historial de notificaciones
  async getNotificationHistory(): Promise<PushNotification[]> {
    try {
      const stored = await AsyncStorage.getItem('notificationHistory');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notification history:', error);
      return [];
    }
  }

  // Cargar configuraciones
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notificationSettings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  // Actualizar configuraciones
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
      
      // Reiniciar verificaciones si es necesario
      if (this.settings.enabled) {
        await this.startPeriodicChecks();
      } else {
        this.stopPeriodicChecks();
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  // Obtener configuraciones actuales
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Enviar notificación de prueba
  async sendTestNotification(): Promise<void> {
    await this.sendNotification({
      id: `test-${Date.now()}`,
      title: '🧪 Notificación de Prueba',
      body: 'Las notificaciones están funcionando correctamente',
      data: { test: true },
      timestamp: Date.now(),
      category: 'weather-alert',
      priority: 'normal',
    });
  }

  // Limpiar historial de notificaciones
  async clearNotificationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notificationHistory');
    } catch (error) {
      console.error('Error clearing notification history:', error);
    }
  }

  // Obtener estadísticas de notificaciones
  async getNotificationStats(): Promise<{
    totalSent: number;
    todaySent: number;
    categoriesEnabled: number;
    lastSent?: number;
  }> {
    try {
      const history = await this.getNotificationHistory();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySent = history.filter(n => n.timestamp >= today.getTime()).length;
      const categoriesEnabled = Object.values(this.settings.categories).filter(Boolean).length;
      const lastSent = history.length > 0 ? history[0].timestamp : undefined;
      
      return {
        totalSent: history.length,
        todaySent,
        categoriesEnabled,
        lastSent,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalSent: 0,
        todaySent: 0,
        categoriesEnabled: 0,
      };
    }
  }

  // Cancelar todas las notificaciones programadas
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Limpiar todos los datos
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['notificationSettings', 'notificationHistory']);
      await this.cancelAllNotifications();
      this.stopPeriodicChecks();
      this.lastAlertCheck = {};
    } catch (error) {
      console.error('Error clearing notification data:', error);
    }
  }
}

export default NotificationService;