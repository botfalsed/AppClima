import { Tabs } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Platform, View, Text } from 'react-native';

import { HapticTab } from '../../components/haptic-tab';
import { IconSymbol } from '../../components/ui/icon-symbol';
import TabBarBackground from '../../components/ui/tab-bar-background';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { WeatherContext } from '../../contexts/WeatherContext';
import { getWeatherGradient } from '../../utils/iconSelector';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { weatherData } = useContext(WeatherContext);
  const [activeTab, setActiveTab] = useState('index');

  // Obtener colores del gradiente basado en el clima con validación de tipos
  const conditionCode = weatherData?.current?.condition?.code ?? 1000;
  const isDay = weatherData?.current?.is_day ?? 1;
  const gradientColors = getWeatherGradient(conditionCode, isDay) || ['#4A90E2', '#7BB3F0', '#A8D0F7'];

  // Función para obtener el título y el icono según la pestaña activa
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'index':
        return {
          title: 'Pronóstico del Clima',
          icon: 'cloud.sun.fill'
        };
      case 'explore':
        return {
          title: '+ Funciones',
          icon: 'cloud.fill'
        };
      default:
        return {
          title: 'Pronóstico del Clima',
          icon: 'cloud.fill'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme.colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
        header: () => (
          <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <IconSymbol size={28} name={headerInfo.icon} color="#e6ebee" />
              </View>
              <Text style={styles.headerTitle}>{headerInfo.title}</Text>
            </View>
          </View>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Clima',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cloud.sun.fill" color={color} />,
        }}
        listeners={{
          focus: () => setActiveTab('index'),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '+ Funciones',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
        listeners={{
          focus: () => setActiveTab('explore'),
        }}
      />
    </Tabs>
  );
}

const styles = {
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.285)',
    position: 'absolute' as const,
    top: 25,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconContainer: {
    marginRight: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
};