import React from 'react';
import { Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mapeo de SF Symbols a Ionicons
const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  'house.fill': 'home',
  'house': 'home-outline',
  'paperplane.fill': 'send',
  'paperplane': 'send-outline',
  'cloud.sun.fill': 'partly-sunny',
  'cloud.sun': 'partly-sunny-outline',
  'sun.max.fill': 'sunny',
  'sun.max': 'sunny-outline',
  'cloud.fill': 'cloudy',
  'cloud': 'cloud-outline',
  'cloud.rain.fill': 'rainy',
  'cloud.rain': 'rainy-outline',
  'cloud.snow.fill': 'snow',
  'cloud.snow': 'snow-outline',
  'cloud.bolt.fill': 'thunderstorm',
  'cloud.bolt': 'thunderstorm-outline',
  'eye.fill': 'eye',
  'eye': 'eye-outline',
  'thermometer': 'thermometer',
  'drop.fill': 'water',
  'drop': 'water-outline',
  'wind': 'leaf',
  'location.fill': 'location',
  'location': 'location-outline',
  'gear.fill': 'settings',
  'gear': 'settings-outline',
  'magnifyingglass': 'search',
  'plus': 'add',
  'minus': 'remove',
  'checkmark': 'checkmark',
  'xmark': 'close',
  'arrow.left': 'arrow-back',
  'arrow.right': 'arrow-forward',
  'arrow.up': 'arrow-up',
  'arrow.down': 'arrow-down',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  ...rest
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
  weight?: string;
}) {
  if (Platform.OS === 'ios') {
    // En iOS, intenta usar el componente específico si está disponible
    try {
      const { IconSymbol: IOSIconSymbol } = require('./icon-symbol.ios');
      return <IOSIconSymbol name={name} size={size} color={color} style={style} {...rest} />;
    } catch {
      // Si falla, usa el fallback de Ionicons
    }
  }
  
  // Usar Ionicons como fallback para otras plataformas
  const ionIconName = iconMap[name] || 'help-circle';
  
  // Debug: mostrar qué icono se está usando
  if (!iconMap[name]) {
    console.log(`Icono no encontrado en el mapeo: ${name}, usando fallback: ${ionIconName}`);
  }
  
  return (
    <Ionicons
      name={ionIconName}
      size={size}
      color={color}
      style={style}
      {...rest}
    />
  );
}