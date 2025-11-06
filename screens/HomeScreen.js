import React, { useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { logoutUser } from "../services/authService";

export default function HomeScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Patient Dashboard",
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate("MenuScreen")}>
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            style={{ marginRight: 15 }}
          />
        </TouchableOpacity>
      ),
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Health Overview</Text>

      <View style={styles.cardsRow}>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>BP</Text>
          <Text>-- / --</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>SpO₂</Text>
          <Text>--%</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>Heart Rate</Text>
          <Text>-- bpm</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("BPHIstoryScreen")}
      >
        <Text style={styles.buttonText}>View History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ChatbotScreen")}
      >
        <Text style={styles.buttonText}>Chatbot</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  card: {
    backgroundColor: "#eee",
    padding: 20,
    borderRadius: 10,
    width: "30%",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  button: {
    backgroundColor: "blue",
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: { textAlign: "center", color: "#fff", fontWeight: "bold" },
});
