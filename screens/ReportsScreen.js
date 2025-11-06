// screens/ReportsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { auth, db, storage } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  const fetchReports = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "users", uid, "reports"));
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setReports(list);
      setLoading(false);
    } catch (e) {
      console.log("Fetch Error:", e);
      setLoading(false);
      Alert.alert("Error", "Failed to load reports.");
    }
  };

  useEffect(() => {
    if (!uid) return;
    fetchReports();
  }, [uid]);

  const uploadReport = async () => {
    try {
      // Pick file
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (!result || result.canceled) return;

      const file = result.assets ? result.assets[0] : result;
      const uri = file.uri;
      const fileName = file.name || `report_${Date.now()}.pdf`; // safe fallback

      // Convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Sanity checks to avoid undefined storage errors
      if (!storage) {
        Alert.alert("Storage Error", "Firebase Storage is not initialized.");
        return;
      }
      if (!uid) {
        Alert.alert("Auth Error", "No authenticated user.");
        return;
      }

      // Upload to Storage
      const fileRef = ref(storage, `reports/${uid}/${fileName}`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);

      // Save to Firestore
      await setDoc(doc(collection(db, "users", uid, "reports")), {
        fileUrl: downloadURL,
        fileName,
        uploadedAt: serverTimestamp(),
      });

      await fetchReports();
      Alert.alert("Success", "Report uploaded successfully ✅");
    } catch (error) {
      console.log("Upload Error:", error);
      Alert.alert("Upload Failed", error?.message || "Unknown error");
    }
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" style={{ marginTop: 40 }} color="blue" />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Reports</Text>

      {reports.length === 0 ? (
        <Text style={styles.noReports}>No reports uploaded yet.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.reportItem}>
              <Text style={styles.reportText}>{item.fileName}</Text>
              <Text style={styles.openHint}>
                (Tap to open — will enable later)
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.uploadButton} onPress={uploadReport}>
        <Text style={styles.uploadButtonText}>+ Upload New Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  noReports: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  reportItem: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginVertical: 6,
    backgroundColor: "#f9f9f9",
  },
  reportText: { fontSize: 16, fontWeight: "bold" },
  openHint: { fontSize: 12, color: "#666" },
  uploadButton: {
    backgroundColor: "blue",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  uploadButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
