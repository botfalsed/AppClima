import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timestamp: number;
}

export interface GeolocationSettings {
  enabled: boolean;
  autoUpdate: boolean;
  updateInterval: number; // en minutos
  accuracy: Location.LocationAccuracy;
  lastUpdate?: number;
}

class GeolocationService {
  private static instance: GeolocationService;
  private settings: GeolocationSettings;
  private currentLocation: LocationData | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  private constructor() {
    this.settings = {
      enabled: true,
      autoUpdate: true,
      updateInterval: 30, // 30 minutos por defecto
      accuracy: Location.LocationAccuracy.Balanced,
    };
  }

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  // Inicializar el servicio
  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      if (this.settings.enabled) {
        await this.requestPermissions();
        if (this.settings.autoUpdate) {
          await this.startLocationUpdates();
        }
      }
    } catch (error) {
      console.error('Error initializing geolocation service:', error);
    }
  }

  // Solicitar permisos de ubicación
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('Permiso de ubicación denegado');
        return false;
      }

      // Solicitar permisos de background si está habilitada la actualización automática
      if (this.settings.autoUpdate) {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('Permiso de ubicación en background denegado');
          // Continuar sin background, solo foreground
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Verificar si los permisos están concedidos
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // Obtener ubicación actual
  async getCurrentLocation(forceUpdate: boolean = false): Promise<LocationData | null> {
    try {
      console.log('Getting current location, forceUpdate:', forceUpdate);
      
      if (!await this.hasPermissions()) {
        console.log('No permissions, requesting...');
        const granted = await this.requestPermissions();
        if (!granted) {
          console.warn('Location permissions denied');
          throw new Error('Permisos de ubicación no concedidos');
        }
      }

      // Si tenemos una ubicación reciente y no se fuerza la actualización
      if (!forceUpdate && this.currentLocation && this.isLocationRecent()) {
        console.log('Using cached recent location');
        return this.currentLocation;
      }

      console.log('Fetching new location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: this.settings.accuracy,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      // Intentar obtener información de la ciudad
      try {
        console.log('Getting city name for coordinates:', locationData.latitude, locationData.longitude);
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          locationData.city = address.city || address.subregion || address.region || undefined;
          locationData.country = address.country || undefined;
          console.log('City found:', locationData.city);
        }
      } catch (geocodeError) {
        console.warn('Error getting city name:', geocodeError);
      }

      this.currentLocation = locationData;
      await this.saveCurrentLocation(locationData);
      
      console.log('Location updated successfully:', locationData.city || 'Unknown city');
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      
      // Intentar cargar la última ubicación conocida
      console.log('Attempting to load last known location...');
      const lastLocation = await this.getLastKnownLocation();
      if (lastLocation) {
        console.log('Using last known location:', lastLocation.city);
        this.currentLocation = lastLocation;
        return lastLocation;
      }
      
      console.warn('No location available');
      return null;
    }
  }

  // Iniciar actualizaciones automáticas de ubicación
  async startLocationUpdates(): Promise<void> {
    try {
      if (!await this.hasPermissions()) {
        console.warn('No location permissions, cannot start updates');
        return;
      }

      // Detener actualizaciones previas si existen
      await this.stopLocationUpdates();

      console.log('Starting location updates...');
      
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: this.settings.accuracy,
          timeInterval: this.settings.updateInterval * 60 * 1000, // convertir a ms
          distanceInterval: 1000, // 1km
        },
        async (location: Location.LocationObject) => {
          try {
            const locationData: LocationData = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: Date.now(),
            };

            // Obtener información de la ciudad
            try {
              const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: locationData.latitude,
                longitude: locationData.longitude,
              });

              if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                locationData.city = address.city || address.subregion || address.region || undefined;
                locationData.country = address.country || undefined;
              }
            } catch (geocodeError) {
              console.warn('Error getting city name in update:', geocodeError);
            }

            this.currentLocation = locationData;
            await this.saveCurrentLocation(locationData);
            console.log('Location updated:', locationData.city || 'Unknown city');
          } catch (updateError) {
            console.error('Error processing location update:', updateError);
          }
        }
      );
      
      console.log('Location updates started successfully');
    } catch (error) {
      console.error('Error starting location updates:', error);
      throw error;
    }
  }

  // Detener actualizaciones automáticas
  async stopLocationUpdates(): Promise<void> {
    try {
      if (this.locationSubscription) {
        // Usar el método correcto para remover la suscripción
        if (typeof this.locationSubscription.remove === 'function') {
          this.locationSubscription.remove();
        } else if (typeof this.locationSubscription === 'object' && 'removeSubscription' in this.locationSubscription) {
          // Fallback para versiones anteriores
          (this.locationSubscription as any).removeSubscription();
        }
        this.locationSubscription = null;
        console.log('Location updates stopped');
      }
    } catch (error) {
      console.error('Error stopping location updates:', error);
      // Forzar la limpieza de la suscripción
      this.locationSubscription = null;
    }
  }

  // Verificar si la ubicación actual es reciente
  private isLocationRecent(): boolean {
    if (!this.currentLocation) return false;
    
    const now = Date.now();
    const locationAge = now - this.currentLocation.timestamp;
    const maxAge = this.settings.updateInterval * 60 * 1000; // convertir a ms
    
    return locationAge < maxAge;
  }

  // Obtener la última ubicación conocida
  async getLastKnownLocation(): Promise<LocationData | null> {
    try {
      const stored = await AsyncStorage.getItem('lastKnownLocation');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading last known location:', error);
      return null;
    }
  }

  // Guardar ubicación actual
  private async saveCurrentLocation(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(location));
    } catch (error) {
      console.error('Error saving current location:', error);
    }
  }

  // Cargar configuraciones
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('geolocationSettings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading geolocation settings:', error);
    }
  }

  // Guardar configuraciones
  async saveSettings(newSettings: Partial<GeolocationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem('geolocationSettings', JSON.stringify(this.settings));
      
      // Reiniciar actualizaciones si es necesario
      if (this.settings.enabled && this.settings.autoUpdate) {
        await this.startLocationUpdates();
      } else {
        await this.stopLocationUpdates();
      }
    } catch (error) {
      console.error('Error saving geolocation settings:', error);
    }
  }

  // Obtener configuraciones actuales
  getSettings(): GeolocationSettings {
    return { ...this.settings };
  }

  // Obtener ubicación actual sin actualizar
  getCachedLocation(): LocationData | null {
    return this.currentLocation;
  }

  // Obtener distancia entre dos puntos (en km)
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Limpiar datos almacenados
  async clearStoredData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['lastKnownLocation', 'geolocationSettings']);
      this.currentLocation = null;
      await this.stopLocationUpdates();
    } catch (error) {
      console.error('Error clearing geolocation data:', error);
    }
  }

  // Obtener estadísticas de uso
  async getLocationStats(): Promise<{
    hasLocation: boolean;
    locationAge: number;
    permissionsGranted: boolean;
    autoUpdateEnabled: boolean;
  }> {
    const hasPermissions = await this.hasPermissions();
    const location = this.getCachedLocation();
    
    return {
      hasLocation: !!location,
      locationAge: location ? Date.now() - location.timestamp : 0,
      permissionsGranted: hasPermissions,
      autoUpdateEnabled: this.settings.autoUpdate,
    };
  }
}

export default GeolocationService;