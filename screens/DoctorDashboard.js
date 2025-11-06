import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  FlatList, // To display lists
  ActivityIndicator, // For loading
  TouchableOpacity, // For clickable items
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig"; // Import both auth and db
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore"; // Import Firestore functions

const DoctorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]); // State to hold prescription requests

  // useEffect runs when the component mounts
  useEffect(() => {
    // Set up the query to listen for real-time updates
    // This query looks for documents in the "prescriptions" collection
    // where the "status" is "pending"
    const requestsQuery = query(
      collection(db, "prescriptions"), // Make sure your collection is named "prescriptions"
      where("status", "==", "pending")
    );

    // onSnapshot creates a real-time listener
    const unsubscribe = onSnapshot(
      requestsQuery,
      (querySnapshot) => {
        const pendingRequests = [];
        querySnapshot.forEach((doc) => {
          // Add the document data and its ID to the array
          pendingRequests.push({ id: doc.id, ...doc.data() });
        });
        setRequests(pendingRequests); // Update the state
        setLoading(false); // Stop loading
      },
      (error) => {
        // Handle any errors
        console.error("Error fetching pending requests: ", error);
        Alert.alert("Error", "Could not fetch pending prescription requests.");
        setLoading(false);
      }
    );

    // This cleanup function runs when the component unmounts
    // It's crucial to stop listening to updates to prevent memory leaks
    return () => unsubscribe();
  }, []); // The empty array [] means this effect runs only once

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener in App.js will
      // automatically navigate to the Login screen.
    } catch (error) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  // How to render each item in the FlatList
  const renderRequestItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() =>
        Alert.alert(
          "Request Details",
          `Patient: ${item.patientName}\nMedication: ${item.medication}`
        )
      }
    >
      <Text style={styles.patientName}>
        Patient: {item.patientName || "N/A"}
      </Text>
      <Text style={styles.medication}>
        Medication: {item.medication || "N/A"}
      </Text>
    </TouchableOpacity>
  );

  // Helper component to show loading or list
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      );
    }

    if (requests.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.noRequestsText}>
            No pending prescription requests.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Doctor Dashboard</Text>
      <Text style={styles.subtitle}>
        Welcome, Doctor. Here are the pending prescription requests.
      </Text>

      {/* This View will grow to fill the space, pushing the button down */}
      <View style={styles.listContainer}>{renderContent()}</View>

      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={handleLogout} color="#e63946" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  listContainer: {
    flex: 1, // This makes the container take up available space
  },
  list: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
  noRequestsText: {
    fontSize: 16,
    color: "#6c757d",
  },
  requestItem: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#343a40",
  },
  medication: {
    fontSize: 16,
    color: "#495057",
    marginTop: 5,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
});

export default DoctorDashboard;
