import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CurrentWeather from "@/components/clima/climaactual";
import HourlyForecast from "@/components/clima/climaxhora";
import DailyForecast from "@/components/clima/climaxdias";

// 🔹 Agrupar datos por día
const groupDataByDay = (list: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  list.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  });
  return grouped;
};

export default function HomeScreen() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dailyForecast, setDailyForecast] = useState<any>(null);
  const [selectedDayData, setSelectedDayData] = useState<any>(null);

  const API_KEY = "b45375dea9d20988b3f40bc8ab4a7ab8";
  const lat = -8.379; // Pucallpa
  const lon = -74.5539;

  const URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
  const CURRENT_WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;

  useEffect(() => {
    Promise.all([fetch(URL), fetch(CURRENT_WEATHER_URL)])
      .then(([forecastRes, currentRes]) =>
        Promise.all([forecastRes.json(), currentRes.json()])
      )
      .then(([forecastData, currentData]) => {
        const grouped = groupDataByDay(forecastData.list);
        const days = Object.keys(grouped).map((day) => ({ day, data: grouped[day] }));

        setDailyForecast(days);
        setWeather(currentData);
        setSelectedDayData(days[0]); // Primer día seleccionado
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!weather || !dailyForecast) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff" }}>Error al obtener el clima</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/fondo.jpg")}
      style={styles.background}
      imageStyle={styles.imageStyle}
    >
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.2)"]} style={styles.overlay}>
          <ScrollView contentContainerStyle={{ alignItems: "center" }} showsVerticalScrollIndicator={false}>
            
            {/* Clima actual */}
            <CurrentWeather
              city="Pucallpa"
              temp={Math.round(weather.main.temp)}
              desc={weather.weather[0].description}
              icon={weather.weather[0].icon}
              feelsLike={Math.round(weather.main.feels_like)}
              humidity={weather.main.humidity}
            />

            {/* Pronóstico por horas del día actual */}
            <HourlyForecast data={dailyForecast[0].data} />

            {/* Pronóstico de varios días */}
            <DailyForecast
              forecast={dailyForecast}
              selectedDay={selectedDayData}
              setSelectedDay={setSelectedDayData}
            />
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  background: { flex: 1, width: "100%", height: "100%" },
  imageStyle: { resizeMode: "cover" },
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0 },
  overlay: { flex: 1, padding: 16 },
});
