import React, { useState, useMemo } from "react";
import { Pressable, StyleSheet, View, } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import ThemedText from "../../components/ThemedText";
import useThemeColors from "../hooks/useThemeColors";

const PinEntry = () => {
  const [pin, setPin] = useState<number[]>([]);
  const theme = useThemeColors();
  const { user } = useAuth();
  const router = useRouter();

  const handlePress = (num: number) => {
    if (pin.length < 4) {
      const newPin = [...pin, num];
      setPin(newPin);
      //To update the pin in async storage when the pin input is complete
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
      router.replace("/interests");
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, justifyContent: "center", alignItems: "center" },
        headerText: { 
          marginBottom: 40, 
          textAlign: "center",
          color: theme.primary,
          fontSize: 24,
        },
        text: { 
          marginBottom: 20, 
          textAlign: "center",
          color: theme.primary,
        },
        dots: { flexDirection: "row", marginBottom: 30 },
        dot: {
          width: 50,
          height: 50,
          borderWidth: 1,
          borderRadius: 10,
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
      <ThemedText style={styles.headerText} weight="semibold">Create your HERE Pin</ThemedText>
      <ThemedText style={styles.text}>You'll use it to check into events.</ThemedText>

      {/* PIN dots */}
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.dot}>
            <ThemedText style={styles.dotText}>{pin[i] ? "•" : ""}</ThemedText>
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
            <ThemedText style={styles.keyText}>
              {item === "del" ? "⌫" : item === "ok" ? "→" : item}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default PinEntry;