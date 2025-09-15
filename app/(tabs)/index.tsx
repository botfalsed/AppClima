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
} from "react-native";

export default function HomeScreen() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_KEY = "b45375dea9d20988b3f40bc8ab4a7ab8";
  const lat = -8.379; // Pucallpa
  const lon = -74.5539;

  const URL = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;

  useEffect(() => {
    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        setWeather(data);
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

  if (!weather || !weather.current) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff" }}>No se pudo obtener el clima</Text>
        <Text style={{ color: "#fff" }}>{JSON.stringify(weather)}</Text>
      </View>
    );
  }

  const temp = Math.round(weather.current.temp);
  const desc = weather.current.weather[0].description;

  return (
    <ImageBackground
      source={require("@/assets/images/fondo.jpg")}
      style={styles.background}
      imageStyle={styles.imageStyle}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.overlay} showsVerticalScrollIndicator={false}>
          {/* Clima actual */}
          <View style={styles.card}>
            <Text style={styles.city}>Pucallpa</Text>
            <Text style={styles.temp}>{temp}°C</Text>
            <Text style={styles.desc}>{desc}</Text>
          </View>

          {/* Próximas horas */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Próximas horas</Text>
            <FlatList
              horizontal
              data={weather.hourly.slice(0, 8)}
              keyExtractor={(item) => item.dt.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.hourBox}>
                  <Text style={styles.hourText}>{new Date(item.dt * 1000).getHours()}:00</Text>
                  <Text style={styles.hourText}>{Math.round(item.temp)}°C</Text>
                </View>
              )}
            />
          </View>

          {/* Próximos días */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Próximos días</Text>
            {weather.daily.slice(1, 8).map((d: any) => (
              <View key={d.dt} style={styles.dayBox}>
                <Text style={styles.dayText}>
                  {new Date(d.dt * 1000).toLocaleDateString("es-ES", { weekday: "long" })}
                </Text>
                <Text style={styles.dayText}>
                  {Math.round(d.temp.min)}°C - {Math.round(d.temp.max)}°C
                </Text>
                <Text style={styles.dayText}>{d.weather[0].description}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
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
    resizeMode: "cover", // 🔥 llena toda la pantalla
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0,
  },
  overlay: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)", // sutil para contraste
  },
  card: {
    width: "92%",
    borderWidth: 1.4,
    borderColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "transparent", // 🔹 contenedor transparente
    alignSelf: "center",
  },
  city: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#fff",
  },
  temp: {
    fontSize: 42,
    textAlign: "center",
    marginVertical: 8,
    color: "#fff",
    fontWeight: "700",
  },
  desc: {
    fontSize: 18,
    textAlign: "center",
    color: "#f2f2f2",
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
  },
  hourBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
    backgroundColor: "transparent",
  },
  hourText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  dayBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  dayText: {
    color: "#fff",
    flex: 1,
    textAlign: "center",
    fontSize: 14,
  },
});
