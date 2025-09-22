import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function SearchCity({ onSearch }: { onSearch: (city: string) => void }) {
  const [city, setCity] = useState("");

  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.input}
        placeholder="Buscar ciudad..."
        placeholderTextColor="#ccc"
        value={city}
        onChangeText={setCity}
        onSubmitEditing={() => onSearch(city)} // cuando le das enter
      />
      <TouchableOpacity style={styles.button} onPress={() => onSearch(city)}>
        <Text style={styles.buttonText}>Buscar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
  },
  button: {
    backgroundColor: "#4a90e2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
