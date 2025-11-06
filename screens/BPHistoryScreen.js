import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";

// --- MOCK DATA (Simulating your backend) ---
// I've set the dates around today (Nov 5, 2025) so you'll see
// data when you first open the screen.
const ALL_BP_READINGS = [
  {
    id: "1",
    date: "2025-11-04",
    time: "08:15 AM",
    systolic: 120,
    diastolic: 80,
  },
  {
    id: "2",
    date: "2025-11-04",
    time: "06:30 PM",
    systolic: 125,
    diastolic: 82,
  },
  {
    id: "3",
    date: "2025-11-05",
    time: "09:00 AM",
    systolic: 118,
    diastolic: 78,
  },
  {
    id: "4",
    date: "2025-11-05",
    time: "01:20 PM",
    systolic: 122,
    diastolic: 80,
  },
  {
    id: "5",
    date: "2025-11-05",
    time: "07:00 PM",
    systolic: 124,
    diastolic: 81,
  },
  {
    id: "6",
    date: "2025-11-06",
    time: "08:30 AM",
    systolic: 119,
    diastolic: 79,
  },
];

// Helper function to format a date as 'YYYY-MM-DD'
// This is crucial for matching against our mock data
const getISODateString = (date) => {
  return date.toISOString().split("T")[0];
};

const BPHistoryScreen = () => {
  // State for the selected date, defaults to today
  const [date, setDate] = useState(new Date());
  // State to control if the date picker modal is visible
  const [showPicker, setShowPicker] = useState(false);

  // This is the function that runs when the date picker value changes
  const onDateChange = (event, selectedDate) => {
    // On Android, the picker is hidden automatically. On iOS, we hide it manually.
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) {
      // Update our selected date
      setDate(selectedDate);
    }
  };

  // This will filter our master list based on the selected date
  // useMemo ensures this only re-runs when the 'date' state changes
  const filteredReadings = useMemo(() => {
    const selectedDateString = getISODateString(date);
    return ALL_BP_READINGS.filter(
      (reading) => reading.date === selectedDateString
    );
  }, [date]); // Dependency: re-filter when 'date' changes

  // How to render each item in our list
  const renderReading = ({ item }) => (
    <View style={styles.readingItem}>
      <Text style={styles.readingTime}>{item.time}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.readingValue}>
          {item.systolic} / {item.diastolic}
        </Text>
        <Text style={styles.readingUnit}> mmHg</Text>
      </View>
    </View>
  );

  return (
    // Use SafeAreaView to avoid notches and status bars
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* --- Date Picker Button --- */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Showing history for:</Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateButtonText}>
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- The Date Picker Modal --- */}
      {/* This will only render when showPicker is true */}
      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display="default" // Or "spinner"
          onChange={onDateChange}
        />
      )}

      {/* --- Results List --- */}
      <FlatList
        data={filteredReadings}
        renderItem={renderReading}
        keyExtractor={(item) => item.id}
        style={styles.list}
        // Show this component if the list is empty
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No readings found for this date.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f8", // Light grey background
  },
  pickerContainer: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  dateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  list: {
    flex: 1,
    marginTop: 8, // Add a little space from the picker container
  },
  readingItem: {
    backgroundColor: "#fff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // Nice shadow for depth
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  readingTime: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  readingValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0056b3",
  },
  readingUnit: {
    fontSize: 14,
    color: "#666",
    fontWeight: "normal",
    marginLeft: 4,
    paddingBottom: 2, // Aligns it with the bottom of the number
  },
  emptyContainer: {
    flex: 1,
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});

export default BPHistoryScreen;
