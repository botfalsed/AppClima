import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Función para agrupar los datos por día
const groupDataByDay = (list: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  list.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
    });
    if (!grouped[date]) {
      grouped[date] = [];
    }
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
        const days = Object.keys(grouped).map((day) => ({
          day: day,
          data: grouped[day],
        }));

        setDailyForecast(days);
        setWeather(currentData);
        setLoading(false);
        setSelectedDayData(days[0]); // Seleccionar el primer día por defecto
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
        <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
          Error al obtener datos del clima
        </Text>
        <Text style={{ color: "#aaa" }}>Verifica tu conexión a internet</Text>
      </View>
    );
  }

  const temp = Math.round(weather.main.temp);
  const desc = weather.weather[0].description;
  const icon = weather.weather[0].icon;
  const feelsLike = Math.round(weather.main.feels_like);
  const humidity = weather.main.humidity;

  return (
    <ImageBackground
      source={require("@/assets/images/fondo.jpg")}
      style={styles.background}
      imageStyle={styles.imageStyle}
    >
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.2)"]}
          style={styles.overlay}
        >
          <ScrollView contentContainerStyle={{ alignItems: "center" }} showsVerticalScrollIndicator={false}>
            
            {/* Clima actual */}
            <View style={styles.card}>
              <Text style={styles.city}>Pucallpa</Text>
              <Image
                source={{ uri: `https://openweathermap.org/img/wn/${icon}@4x.png` }}
                style={styles.icon}
              />
              <Text style={styles.temp}>{temp}°C</Text>
              <Text style={styles.desc}>{desc}</Text>
              <Text style={styles.extra}>Sensación: {feelsLike}°C</Text>
              <Text style={styles.extra}>Humedad: {humidity}%</Text>
            </View>

            {/* Próximas horas */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Próximas horas ⏰</Text>
              <FlatList
                horizontal
                data={dailyForecast[0].data.slice(0, 8)} // Datos de las primeras 8 horas del día actual
                keyExtractor={(item) => item.dt.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  const hour = new Date(item.dt * 1000).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <View style={styles.hourBox}>
                      <Text style={styles.hourText}>{hour}</Text>
                      <Image
                        source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png` }}
                        style={{ width: 40, height: 40 }}
                      />
                      <Text style={styles.hourText}>{Math.round(item.main.temp)}°C</Text>
                    </View>
                  );
                }}
              />
            </View>

            {/* Próximos días */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Próximos días 📅</Text>
              {dailyForecast.map((d: any, index: number) => {
                const mainWeather = d.data[0].weather[0];
                const dayTemp = Math.round(d.data[0].main.temp);
                
                return (
                  <TouchableOpacity key={d.day} onPress={() => setSelectedDayData(d)}>
                    <View
                      style={[
                        styles.dayBox,
                        { 
                          backgroundColor: selectedDayData && selectedDayData.day === d.day ? "rgba(255,255,255,0.25)" : "transparent",
                          borderBottomWidth: index === dailyForecast.length - 1 ? 0 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.dayText, { textAlign: "left" }]}>{d.day}</Text>
                      <Image
                        source={{ uri: `https://openweathermap.org/img/wn/${mainWeather.icon}.png` }}
                        style={{ width: 36, height: 36 }}
                      />
                      <Text style={[styles.dayText, { textAlign: "right" }]}>
                        {dayTemp}°C
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Próximas horas del día seleccionado */}
            {selectedDayData && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Previsión de {selectedDayData.day} ⏰</Text>
                <FlatList
                  horizontal
                  data={selectedDayData.data}
                  keyExtractor={(item) => item.dt.toString()}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const hour = new Date(item.dt * 1000).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <View style={styles.hourBox}>
                        <Text style={styles.hourText}>{hour}</Text>
                        <Image
                          source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png` }}
                          style={{ width: 40, height: 40 }}
                        />
                        <Text style={styles.hourText}>{Math.round(item.main.temp)}°C</Text>
                      </View>
                    );
                  }}
                />
              </View>
            )}

          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  imageStyle: {
    resizeMode: "cover", // fondo que cubre toda la pantalla
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0,
  },
  overlay: {
    flex: 1,
    padding: 16,
  },
  card: {
    width: "92%",
    borderWidth: 1.4,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.15)", // glassmorphism
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  city: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#fff",
    marginBottom: 4,
  },
  temp: {
    fontSize: 42,
    textAlign: "center",
    marginVertical: 6,
    color: "#fff",
    fontWeight: "700",
  },
  desc: {
    fontSize: 18,
    textAlign: "center",
    color: "#f2f2f2",
    fontStyle: "italic",
    marginBottom: 4,
  },
  extra: {
    fontSize: 14,
    color: "#ddd",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#fff",
    alignSelf: "flex-start",
  },
  icon: {
    width: 100,
    height: 100,
  },
  hourBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  hourText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  dayBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    width: "100%",
  },
  dayText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
    textAlign: "center",
  },
});