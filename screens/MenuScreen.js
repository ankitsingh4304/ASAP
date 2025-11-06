import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { logoutUser } from "../services/authService";

export default function MenuScreen({ navigation }) {
  const handleLogout = async () => {
    await logoutUser();
    navigation.replace("LoginScreen");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("ReportsScreen")}
      >
        <Text style={styles.text}>My Reports</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={handleLogout}>
        <Text style={styles.text}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  text: { fontSize: 18 },
});
