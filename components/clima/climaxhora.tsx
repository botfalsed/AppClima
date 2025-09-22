import React from "react";
import { View, Text, FlatList, StyleSheet, Image } from "react-native";

export default function HourlyForecast({ data }: any) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Próximas horas ⏰</Text>
      <FlatList
        horizontal
        data={data.slice(0, 8)}
        keyExtractor={(item) => item.dt.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer} // 🔹 centra los items
        renderItem={({ item }) => {
          const hour = new Date(item.dt * 1000).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <View style={styles.hourBox}>
              <Text style={styles.hourText}>{hour}</Text>
              <Image
                source={{
                  uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
                }}
                style={styles.icon}
              />
              <Text style={styles.hourText}>{Math.round(item.main.temp)}°C</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#fff",
    textAlign: "center", 
  },
  listContainer: {
    alignItems: "center", 
    paddingVertical: 6,
    margin:"auto",  
  },
  hourBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: 70,
    height: 100,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  hourText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
  icon: {
    width: 32,
    height: 32,
    marginVertical: 4,
  },
});
