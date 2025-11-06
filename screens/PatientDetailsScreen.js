import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// We'll get patientId from navigation params later
const PatientDetailsScreen = ({ route, navigation }) => {
  // const { patientId, prescriptionId } = route.params;

  // --- MOCK DATA (to simulate what we will fetch) ---
  // We will replace this with real data in a future step
  const patientVitals = {
    bp: "145/92",
    spo2: "96%",
    heartRate: "88",
  };

  const prescription = {
    summary:
      "Patient has a 3-day history of dizziness and fatigue. BP readings have been consistently elevated (avg. 145/92) over the last 48 hours. Patient denies chest pain in the AI chat.",
    aiSuggestion: {
      medicine: "Lisinopril",
      dosage: "10mg",
      instructions: "Take one tablet daily in the morning.",
    },
  };
  // ----------------------------------------------------

  const handleApprove = () => {
    // We will add Firebase logic here
    Alert.alert("Approved", "Prescription has been approved.");
    navigation.goBack();
  };

  const handleUpdate = () => {
    // We will build the "Update" modal/screen later
    Alert.alert("Update", "This will open an edit screen.");
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- 1. Vitals Section (like patient's dashboard) --- */}
        <Text style={styles.sectionTitle}>Patient Vitals</Text>
        <View style={styles.vitalsContainer}>
          <View style={[styles.bubble, styles.bubbleLarge]}>
            <Text style={styles.bubbleLabel}>Blood Pressure</Text>
            <Text style={styles.bubbleValue}>{patientVitals.bp}</Text>
            <Text style={styles.bubbleUnit}>mmHg</Text>
          </View>
          <View style={styles.smallBubbleContainer}>
            <View style={[styles.bubble, styles.bubbleSmall]}>
              <Text style={styles.bubbleLabel}>SpO2</Text>
              <Text style={styles.bubbleValue}>{patientVitals.spo2}</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleSmall]}>
              <Text style={styles.bubbleLabel}>Heart Rate</Text>
              <Text style={styles.bubbleValue}>{patientVitals.heartRate}</Text>
              <Text style={styles.bubbleUnit}>bpm</Text>
            </View>
          </View>
        </View>

        {/* --- 2. AI Suggested Prescription --- */}
        <Text style={styles.sectionTitle}>AI Suggested Prescription</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            <Text style={styles.cardLabel}>Medicine: </Text>
            {prescription.aiSuggestion.medicine}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.cardLabel}>Dosage: </Text>
            {prescription.aiSuggestion.dosage}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.cardLabel}>Instructions: </Text>
            {prescription.aiSuggestion.instructions}
          </Text>
        </View>

        {/* --- 3. Patient Context Summary --- */}
        <Text style={styles.sectionTitle}>Patient Context Summary</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>{prescription.summary}</Text>
        </View>

        {/* --- 4. Action Buttons --- */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.updateButton]}
            onPress={handleUpdate}
          >
            <Text style={styles.buttonText}>Update Prescription</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={handleApprove}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7f8",
  },
  scrollContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#444",
    marginBottom: 15,
    marginTop: 10,
  },
  // --- Vitals Bubbles (Copied from HomeScreen) ---
  vitalsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  bubble: {
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bubbleLarge: {
    width: 180,
    height: 180,
    borderColor: "#007bff",
    borderWidth: 4,
  },
  smallBubbleContainer: {
    justifyContent: "space-between",
  },
  bubbleSmall: {
    width: 120,
    height: 120,
    borderColor: "#28a745",
    borderWidth: 3,
  },
  bubbleLabel: { fontSize: 14, color: "#666", fontWeight: "500" },
  bubbleValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  bubbleUnit: { fontSize: 14, color: "#888" },
  // --- Card Styles ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 5,
  },
  cardLabel: {
    fontWeight: "bold",
  },
  // --- Button Styles ---
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 50,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
  },
  updateButton: {
    backgroundColor: "#ffc107", // Yellow
    marginRight: 10,
  },
  approveButton: {
    backgroundColor: "#28a745", // Green
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PatientDetailsScreen;
