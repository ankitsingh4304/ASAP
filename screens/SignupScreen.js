import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  StyleSheet,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { registerUser } from "../services/authService";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [reportFile, setReportFile] = useState(null);

  const pickReport = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (!result.canceled) setReportFile(result.assets[0]);
  };

  const handleSignup = async () => {
    if (!name || !email || !password) return alert("Fill all fields");
    try {
      await registerUser(name, email, password, role, reportFile);
      alert("Account Created! Please Login.");
      navigation.replace("LoginScreen");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Select Role:</Text>
      <View style={styles.roleRow}>
        <Button
          title="Patient"
          color={role === "patient" ? "blue" : "gray"}
          onPress={() => setRole("patient")}
        />
        <Button
          title="Doctor"
          color={role === "doctor" ? "blue" : "gray"}
          onPress={() => setRole("doctor")}
        />
      </View>

      {role === "patient" && (
        <View style={{ marginVertical: 10 }}>
          <Button title="Upload Initial Report" onPress={pickReport} />
          {reportFile && <Text>Selected: {reportFile.name}</Text>}
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleSignup}>
        <Text style={styles.btnText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
        <Text style={{ marginTop: 10 }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 50 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 5, padding: 10, marginVertical: 6 },
  label: { marginTop: 10, fontWeight: "bold" },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  btn: { backgroundColor: "blue", padding: 14, borderRadius: 5, marginTop: 20 },
  btnText: { color: "white", textAlign: "center", fontWeight: "bold" },
});
