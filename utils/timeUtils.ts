// Utilidades para manejo de tiempo y zonas horarias

/**
 * Obtiene la hora actual en la zona horaria especificada
 * @param timezone - ID de la zona horaria (ej: "America/New_York")
 * @param locale - Locale para el formateo (por defecto "es-ES")
 * @returns Hora formateada como string
 */
export const getCurrentTimeInTimezone = (
  timezone: string, 
  locale: string = 'es-ES'
): string => {
  try {
    const now = new Date();
    return now.toLocaleTimeString(locale, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.log('Error obteniendo hora en zona horaria:', error);
    // Fallback a hora local
    return new Date().toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
};

/**
 * Obtiene la hora actual en formato 12 horas para la zona horaria especificada
 * @param timezone - ID de la zona horaria
 * @param locale - Locale para el formateo
 * @returns Hora formateada en formato 12 horas
 */
export const getCurrentTime12HourInTimezone = (
  timezone: string, 
  locale: string = 'es-ES'
): string => {
  try {
    const now = new Date();
    return now.toLocaleTimeString(locale, {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.log('Error obteniendo hora 12h en zona horaria:', error);
    // Fallback a hora local
    return new Date().toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
};

/**
 * Obtiene la hora actual como número (0-23) en la zona horaria especificada
 * @param timezone - ID de la zona horaria
 * @returns Hora como número (0-23)
 */
export const getCurrentHourInTimezone = (timezone: string): number => {
  try {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false
    });
    return parseInt(timeString.split(':')[0], 10);
  } catch (error) {
    console.log('Error obteniendo hora numérica en zona horaria:', error);
    // Fallback a hora local
    return new Date().getHours();
  }
};

/**
 * Convierte una fecha/hora de la API a la zona horaria local del usuario
 * @param apiDateTime - Fecha/hora de la API (formato: "YYYY-MM-DD HH:MM")
 * @param timezone - ID de la zona horaria de la ubicación
 * @returns Fecha ajustada a la zona horaria
 */
export const convertApiTimeToTimezone = (
  apiDateTime: string, 
  timezone: string
): Date => {
  try {
    // La API ya proporciona la hora local, pero vamos a asegurar la zona horaria
    const date = new Date(apiDateTime);
    
    // Crear una nueva fecha en la zona horaria específica
    const timeString = date.toLocaleString('sv-SE', { timeZone: timezone });
    return new Date(timeString);
  } catch (error) {
    console.log('Error convirtiendo tiempo de API:', error);
    // Fallback a la fecha original
    return new Date(apiDateTime);
  }
};

/**
 * Formatea una hora para mostrar en el pronóstico por horas
 * @param timeString - String de tiempo de la API
 * @param timezone - ID de la zona horaria
 * @param isFirst - Si es la primera hora (mostrar "Ahora")
 * @returns Hora formateada
 */
export const formatHourlyTime = (
  timeString: string, 
  timezone: string, 
  isFirst: boolean = false
): string => {
  try {
    if (isFirst) {
      return 'Ahora';
    }
    
    // Extraer la hora del string "YYYY-MM-DD HH:MM"
    const timePart = timeString.split(' ')[1];
    if (!timePart) return 'N/A';
    
    const hour = parseInt(timePart.split(':')[0], 10);
    
    // Formatear en formato 12 horas
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  } catch (error) {
    console.log('Error formateando hora:', error);
    return 'N/A';
  }
};

/**
 * Verifica si una zona horaria es válida
 * @param timezone - ID de la zona horaria a verificar
 * @returns true si la zona horaria es válida
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};