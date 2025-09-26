import React, { useContext, useEffect } from 'react';
import { ScrollView, StyleSheet, ImageBackground, View } from 'react-native';
import { WeatherContext } from '../../contexts/WeatherContext';
import { getBackgroundImage } from '../../utils/backgroundSelector';
import Buscar from '../../components/clima/buscar';
import ClimaActual from '../../components/clima/climaactual';
import ClimaXHora from '../../components/clima/climaxhora';
import ClimaXDias from '../../components/clima/climaxdias';

export default function HomeScreen() {
  const { weatherData, fetchWeatherData } = useContext(WeatherContext);

  useEffect(() => {
    // Cargar datos por defecto de Pucallpa al iniciar
    fetchWeatherData('Pucallpa');
  }, []);

  const backgroundImage = weatherData ? getBackgroundImage(weatherData.current.condition.code, weatherData.current.is_day) : null;

  return (
    <ImageBackground 
      source={backgroundImage} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.searchContainer}>
        <Buscar />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ClimaActual />
        <ClimaXHora />
        <ClimaXDias />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingTop: 50, // Espacio para la barra de estado
    paddingBottom: 10, // Espacio inferior para separación
  },
  scrollView: {
    flex: 1,
    marginTop: 215, // Margen superior para evitar superposición
  },
});
