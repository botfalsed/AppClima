/**
 * Selecciona el ícono apropiado basado en el código de condición climática y si es de día o noche
 */
export function getWeatherIcon(conditionCode: number, isDay: number): string {
  // Códigos de condición de WeatherAPI
  // Referencia: https://www.weatherapi.com/docs/weather_conditions.json
  
  if (isDay === 1) {
    // Íconos para el día
    switch (conditionCode) {
      case 1000: // Clear/Sunny
        return "sun.max.fill";
      case 1003: // Partly cloudy
        return "cloud.sun.fill";
      case 1006: // Cloudy
      case 1009: // Overcast
        return "cloud.fill";
      case 1030: // Mist
      case 1135: // Fog
      case 1147: // Freezing fog
        return "cloud.fog.fill";
      case 1063: // Patchy rain possible
      case 1180: // Light rain
      case 1183: // Light rain
      case 1186: // Moderate rain at times
      case 1189: // Moderate rain
      case 1192: // Heavy rain at times
      case 1195: // Heavy rain
      case 1240: // Light rain shower
      case 1243: // Moderate or heavy rain shower
      case 1246: // Torrential rain shower
        return "cloud.rain.fill";
      case 1066: // Patchy snow possible
      case 1210: // Light snow
      case 1213: // Light snow
      case 1216: // Moderate snow
      case 1219: // Moderate snow
      case 1222: // Heavy snow
      case 1225: // Heavy snow
      case 1255: // Light snow showers
      case 1258: // Moderate or heavy snow showers
        return "cloud.snow.fill";
      case 1087: // Thundery outbreaks possible
      case 1273: // Patchy light rain with thunder
      case 1276: // Moderate or heavy rain with thunder
      case 1279: // Patchy light snow with thunder
      case 1282: // Moderate or heavy snow with thunder
        return "cloud.bolt.rain.fill";
      case 1114: // Blowing snow
      case 1117: // Blizzard
        return "wind.snow";
      case 1069: // Patchy sleet possible
      case 1072: // Patchy freezing drizzle possible
      case 1168: // Freezing drizzle
      case 1171: // Heavy freezing drizzle
      case 1198: // Light freezing rain
      case 1201: // Moderate or heavy freezing rain
      case 1204: // Light sleet
      case 1207: // Moderate or heavy sleet
      case 1249: // Light sleet showers
      case 1252: // Moderate or heavy sleet showers
        return "cloud.sleet.fill";
      case 1237: // Ice pellets
      case 1261: // Light showers of ice pellets
      case 1264: // Moderate or heavy showers of ice pellets
        return "cloud.hail.fill";
      default:
        return "cloud.sun.fill";
    }
  } else {
    // Íconos para la noche
    switch (conditionCode) {
      case 1000: // Clear
        return "moon.stars.fill";
      case 1003: // Partly cloudy
        return "cloud.moon.fill";
      case 1006: // Cloudy
      case 1009: // Overcast
        return "cloud.fill";
      case 1030: // Mist
      case 1135: // Fog
      case 1147: // Freezing fog
        return "cloud.fog.fill";
      case 1063: // Patchy rain possible
      case 1180: // Light rain
      case 1183: // Light rain
      case 1186: // Moderate rain at times
      case 1189: // Moderate rain
      case 1192: // Heavy rain at times
      case 1195: // Heavy rain
      case 1240: // Light rain shower
      case 1243: // Moderate or heavy rain shower
      case 1246: // Torrential rain shower
        return "cloud.rain.fill";
      case 1066: // Patchy snow possible
      case 1210: // Light snow
      case 1213: // Light snow
      case 1216: // Moderate snow
      case 1219: // Moderate snow
      case 1222: // Heavy snow
      case 1225: // Heavy snow
      case 1255: // Light snow showers
      case 1258: // Moderate or heavy snow showers
        return "cloud.snow.fill";
      case 1087: // Thundery outbreaks possible
      case 1273: // Patchy light rain with thunder
      case 1276: // Moderate or heavy rain with thunder
      case 1279: // Patchy light snow with thunder
      case 1282: // Moderate or heavy snow with thunder
        return "cloud.bolt.rain.fill";
      case 1114: // Blowing snow
      case 1117: // Blizzard
        return "wind.snow";
      case 1069: // Patchy sleet possible
      case 1072: // Patchy freezing drizzle possible
      case 1168: // Freezing drizzle
      case 1171: // Heavy freezing drizzle
      case 1198: // Light freezing rain
      case 1201: // Moderate or heavy freezing rain
      case 1204: // Light sleet
      case 1207: // Moderate or heavy sleet
      case 1249: // Light sleet showers
      case 1252: // Moderate or heavy sleet showers
        return "cloud.sleet.fill";
      case 1237: // Ice pellets
      case 1261: // Light showers of ice pellets
      case 1264: // Moderate or heavy showers of ice pellets
        return "cloud.hail.fill";
      default:
        return "cloud.moon.fill";
    }
  }
}

/**
 * Obtiene colores dinámicos para el gradiente basado en las condiciones climáticas
 */
export function getWeatherGradient(conditionCode: number, isDay: number): string[] {
  if (isDay === 1) {
    // Gradientes para el día
    switch (conditionCode) {
      case 1000: // Clear/Sunny
        return ['#FFD700', '#FFA500', '#FF8C00'];
      case 1003: // Partly cloudy
        return ['#4A90E2', '#87CEEB', '#B0E0E6'];
      case 1006: // Cloudy
      case 1009: // Overcast
        return ['#708090', '#778899', '#B0C4DE'];
      case 1030: // Mist
      case 1135: // Fog
      case 1147: // Freezing fog
        return ['#D3D3D3', '#C0C0C0', '#A9A9A9'];
      case 1063: // Rain
      case 1180: case 1183: case 1186: case 1189:
      case 1192: case 1195: case 1240: case 1243: case 1246:
        return ['#4682B4', '#5F9EA0', '#6495ED'];
      case 1066: // Snow
      case 1210: case 1213: case 1216: case 1219:
      case 1222: case 1225: case 1255: case 1258:
        return ['#E6E6FA', '#F0F8FF', '#F5F5F5'];
      case 1087: // Thunder
      case 1273: case 1276: case 1279: case 1282:
        return ['#2F4F4F', '#483D8B', '#6A5ACD'];
      default:
        return ['#4A90E2', '#7BB3F0', '#A8D0F7'];
    }
  } else {
    // Gradientes para la noche
    switch (conditionCode) {
      case 1000: // Clear
        return ['#191970', '#483D8B', '#6A5ACD'];
      case 1003: // Partly cloudy
        return ['#2F4F4F', '#4682B4', '#5F9EA0'];
      case 1006: // Cloudy
      case 1009: // Overcast
        return ['#2F2F2F', '#404040', '#555555'];
      case 1030: // Mist/Fog
      case 1135: case 1147:
        return ['#696969', '#708090', '#778899'];
      case 1063: // Rain
      case 1180: case 1183: case 1186: case 1189:
      case 1192: case 1195: case 1240: case 1243: case 1246:
        return ['#1E3A8A', '#1E40AF', '#3B82F6'];
      case 1066: // Snow
      case 1210: case 1213: case 1216: case 1219:
      case 1222: case 1225: case 1255: case 1258:
        return ['#4B5563', '#6B7280', '#9CA3AF'];
      case 1087: // Thunder
      case 1273: case 1276: case 1279: case 1282:
        return ['#1F2937', '#374151', '#4B5563'];
      default:
        return ['#1E3A8A', '#3B82F6', '#60A5FA'];
    }
  }
}