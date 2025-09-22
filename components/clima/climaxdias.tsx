import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";

export default function DailyForecast({ forecast, selectedDay, setSelectedDay }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Próximos días 📅</Text>

      {forecast.map((d: any, index: number) => (
        <View key={d.day} style={styles.dayContainer}>
          <TouchableOpacity
            style={styles.dayBox}
            onPress={() => setSelectedDay(selectedDay?.day === d.day ? null : d)}
          >
            <Text style={styles.dayText}>{d.day}</Text>
            <Text style={styles.dayText}>
              {Math.round(d.data[0].main.temp)}°C
            </Text>
          </TouchableOpacity>

          {/* Mostrar las horas SOLO si ese día está seleccionado */}
          {selectedDay?.day === d.day && (
            <View style={styles.hourlyBox}>
              <Text style={styles.subTitle}>Pronóstico por horas ⏰</Text>
              <FlatList
                horizontal
                data={d.data}
                keyExtractor={(item) => item.dt.toString()}
                renderItem={({ item }) => {
                  const hour = new Date(item.dt * 1000).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <View style={styles.hourBox}>
                      <Text style={styles.hourText}>{hour}</Text>
                      <Text style={styles.hourText}>{Math.round(item.main.temp)}°C</Text>
                    </View>
                  );
                }}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "92%",
    borderWidth: 1.4,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
  },
  dayContainer: {
    marginBottom: 10,
  },
  dayBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  dayText: {
    color: "#fff",
    fontSize: 14,
  },
  hourlyBox: {
    marginTop: 8,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#fff",
  },
  hourBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
    minWidth: 65, // 🔹 Más compacto
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  hourText: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
});

