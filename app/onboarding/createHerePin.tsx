import React, { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

const PinEntry = () => {
  const [pin, setPin] = useState<number[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  const handlePress = (num: number) => {
    if (pin.length < 4) {
      const newPin = [...pin, num];
      setPin(newPin);

      // Update user's pin only when the pin is complete
      if (newPin.length === 4 && user) {
        user.pin = newPin.join("");
      }
    }
  };

  const handleDelete = () => {
    setPin((prevPin) => prevPin.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin.length === 4) {
      router.replace("/onboarding/interests");
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, justifyContent: "center", alignItems: "center" },
        text: { fontSize: 18, marginBottom: 20, textAlign: "center" },
        dots: { flexDirection: "row", marginBottom: 30 },
        dot: {
          width: 40,
          height: 40,
          borderWidth: 1,
          borderRadius: 8,
          margin: 5,
          justifyContent: "center",
          alignItems: "center",
        },
        dotText: { fontSize: 24 },
        keypad: {
          flexDirection: "row",
          flexWrap: "wrap",
          width: 240,
          justifyContent: "center",
        },
        key: {
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#eee",
          margin: 10,
          justifyContent: "center",
          alignItems: "center",
        },
        keyText: { fontSize: 20 },
      }),
    []
  );

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create your HERE Pin to get started</Text>
      <Text style={styles.text}>This pin will be used to check into events.</Text>

      {/* PIN dots */}
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.dot}>
            <Text style={styles.dotText}>{pin[i] ? "•" : ""}</Text>
          </View>
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "del", 0, "ok"].map((item, idx) => (
          <Pressable
            key={idx}
            style={styles.key}
            onPress={() => {
              if (item === "del") {
                handleDelete();
              } else if (item === "ok") {
                handleSubmit();
              } else if (typeof item === "number") {
                handlePress(item);
              }
            }}
          >
            <Text style={styles.keyText}>
              {item === "del" ? "⌫" : item === "ok" ? "→" : item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default PinEntry;