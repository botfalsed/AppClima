import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function CurrentWeather({ city, temp, desc, icon, feelsLike, humidity }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.city}>{city}</Text>
      <Image
        source={{ uri: `https://openweathermap.org/img/wn/${icon}@4x.png` }}
        style={styles.icon}
      />
      <Text style={styles.temp}>{temp}°C</Text>
      <Text style={styles.desc}>{desc}</Text>
      <Text style={styles.extra}>Sensación: {feelsLike}°C</Text>
      <Text style={styles.extra}>Humedad: {humidity}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", marginBottom: 16 },
  city: { fontSize: 26, fontWeight: "700", color: "#fff" },
  temp: { fontSize: 42, fontWeight: "700", color: "#fff" },
  desc: { fontSize: 18, fontStyle: "italic", color: "#f2f2f2" },
  extra: { fontSize: 14, color: "#ddd" },
  icon: { width: 100, height: 100 },
});
