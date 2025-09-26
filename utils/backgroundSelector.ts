// Función para seleccionar el fondo según el estado del clima
export const getWeatherBackground = (conditionCode: number, isDay: number = 1) => {
  // Códigos de condición climática de WeatherAPI.com
  // https://www.weatherapi.com/docs/weather_conditions.json
  
  // Soleado / Despejado
  if ([1000].includes(conditionCode)) {
    return isDay 
      ? require('@/assets/images/soleado.jpg')
      : require('@/assets/images/nocheDespejada.jpg');
  }
  
  // Parcialmente nublado
  if ([1003].includes(conditionCode)) {
    return isDay 
      ? require('@/assets/images/parcialmenteNublado.jpg')
      : require('@/assets/images/nocheParcialDespejada.jpg');
  }
  
  // Nublado / Muy nublado
  if ([1006, 1009].includes(conditionCode)) {
    return isDay 
      ? require('@/assets/images/nublado_dia.jpg') // Nublado de día
      : require('@/assets/images/nublado_noche.jpg'); // Nublado de noche (usar imagen nocturna)
  }
  
  // Niebla / Bruma
  if ([1030, 1135, 1147].includes(conditionCode)) {
    return isDay 
      ? require('@/assets/images/niebla_dia.jpg') // Niebla de día
      : require('@/assets/images/niebla_noche.jpg'); // Niebla de noche
  }
  
  // Llovizna
  if ([1150, 1153, 1168, 1171].includes(conditionCode)) {
    return isDay 
      ? require('@/assets/images/llovizna_dia.jpg') // Llovizna de día
      : require('@/assets/images/llovizna_noche.jpg'); // Llovizna de noche
  }

  // Lluvia (ligera a fuerte)
  if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(conditionCode)) {
    return isDay 
      ? require('@/assets/images/llovizna_dia.jpg') // Lluvia de día
      : require('@/assets/images/llovizna_noche.jpg'); // Lluvia de noche
  }
  
  // Aguanieve / Granizo
  if ([1069, 1204, 1207, 1237, 1249, 1252, 1261, 1264].includes(conditionCode)) {
    return isDay 
      ? require('@/assets/images/granizo_dia.jpg') // Aguanieve de día
      : require('@/assets/images/granizo_noche.jpg'); // Aguanieve de noche
  }

  // Tormenta
  if ([1087, 1273, 1276, 1279, 1282].includes(conditionCode)) {
    return isDay 
      ? require('@/assets/images/tormenta_dia.jpg') // Tormenta de día
      : require('@/assets/images/tormenta_noche.jpg'); // Tormenta de noche
  }
  
  // Nieve
  if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(conditionCode)) {
    return isDay 
      ? require('@/assets/images/clima.jpg') // Nieve de día (temporal)
      : require('@/assets/images/nieve_noche.jpg'); // Nieve de noche (temporal)
  }
  
  // Fondo predeterminado
  return require('@/assets/images/clima.jpg');
};

// Alias para compatibilidad
export const getBackgroundImage = getWeatherBackground;