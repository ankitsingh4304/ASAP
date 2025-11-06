import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  // Import FlatList instead of ScrollView
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Initial Message ---
const INITIAL_MESSAGE = {
  id: 1,
  text: "Hello! I am your AI Health Assistant. How can I help you today?",
  sender: "ai", // 'ai' or 'user'
};

const ChatScreen = () => {
  // --- STATE ---
  // 1. To store all messages in an array
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  // 2. To store the text currently in the input box
  const [inputText, setInputText] = useState("");

  // --- SEND FUNCTION ---
  const handleSend = () => {
    // Don't send an empty message
    if (inputText.trim() === "") {
      return;
    }

    // 1. Create a new message object
    const newUserMessage = {
      id: Date.now(), // Simple unique ID
      text: inputText,
      sender: "user",
    };

    // 2. Add the new message to our state
    //    We add it to the START of the array because the list is 'inverted'
    setMessages((prevMessages) => [newUserMessage, ...prevMessages]);

    // 3. Clear the input box
    setInputText("");

    // 4. Simulate a reply from the AI
    setTimeout(() => {
      const aiReply = {
        id: Date.now() + 1,
        text: "This is a default reply. I am processing your request.",
        sender: "ai",
      };
      // Add the AI reply to the start of the array
      setMessages((prevMessages) => [aiReply, ...prevMessages]);
    }, 1000); // 1-second delay
  };

  // --- RENDER FUNCTION FOR EACH BUBBLE ---
  const renderMessageBubble = ({ item }) => {
    const isUserMessage = item.sender === "user";

    return (
      <View
        style={[
          styles.messageBubble,
          // Use different styles based on who sent the message
          isUserMessage ? styles.userMessageBubble : styles.aiMessageBubble,
        ]}
      >
        <Text
          style={isUserMessage ? styles.userMessageText : styles.aiMessageText}
        >
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        style={styles.container}
        keyboardVerticalOffset={90} // Keep 90 if it worked!
      >
        {/* =============================================
             1. CHAT AREA (Now a FlatList)
            ============================================= */}
        <FlatList
          style={styles.chatArea}
          data={messages} // The list of messages from our state
          renderItem={renderMessageBubble} // How to render each item
          keyExtractor={(item) => item.id.toString()} // Unique key for each
          inverted // <-- THIS IS THE MAGIC! It starts from the bottom.
        />

        {/* =============================================
             2. INPUT AREA (This is now "state-aware")
            ============================================= */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.prescriptionButton}>
            <Text style={styles.prescriptionButtonText}>
              Request Prescription
            </Text>
          </TouchableOpacity>

          <View style={styles.textInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              value={inputText} // Display the value from state
              onChangeText={setInputText} // Update the state when user types
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend} // Call our send function!
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  chatArea: {
    flex: 1, // This is still essential
    paddingHorizontal: 10,
  },

  // --- Message Bubble Styles ---
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: "80%",
    marginBottom: 10,
  },
  aiMessageBubble: {
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start", // Left side
  },
  userMessageBubble: {
    backgroundColor: "#007bff", // Blue
    alignSelf: "flex-end", // Right side
  },
  aiMessageText: {
    fontSize: 16,
    color: "#000",
  },
  userMessageText: {
    fontSize: 16,
    color: "#fff",
  },

  // --- Input Area Styles ---
  inputArea: {
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  prescriptionButton: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
  },
  prescriptionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  textInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChatScreen;
