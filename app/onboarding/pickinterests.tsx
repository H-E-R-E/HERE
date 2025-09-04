import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, Pressable } from 'react-native';
import ThemedText from '../../components/ThemedText';
import { useRouter } from 'expo-router';
import useThemeColors from '../hooks/useThemeColors';
import FormPressable from '../../components/FormPressable';
import AnimatedButton from '../../components/AnimatedButton';
import { Feather } from '@expo/vector-icons';
import BouncyCheckbox from "react-native-bouncy-checkbox";

type Question = {
  title: string;
  options: string[];
  type: "checkbox" | "radio";
};

export default function PickInterests() {
  const router = useRouter();
  const theme = useThemeColors();

  const [modalVisible, setModalVisible] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const questions = [
    { title: "What is your skill?", options: ["Event Planner", "Videographer", "Photographer", "Vendor", "Dancer", "Designer", "Other"], type: "checkbox" },
    { title: "What kinds of events are you interested in?", options: ["Social Hangouts", "Tech", "Faith & Spiritual", "Music & Concerts", "Sports & Fitness", "Workshops & Training", "Business & Networking"], type: "checkbox" },
    { title: "How do you prefer to attend events?", options: ["Physically", "Virtually", "Both"], type: "radio" }, // 👈 radio
    { title: "What are you looking for when you join an event?", options: ["Fun", "Networking", "Friends", "Connections", "Business", "Partnership", "Knowledge"], type: "checkbox" },
  ] satisfies Question[];
  
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 100, alignItems: 'center' },
    title: { fontSize: 14, fontWeight: '600', color: theme.primary },
    subtitle: { fontSize: 10, color: theme.primary, marginTop: 4, marginBottom: 30 },
    questionGroup: { marginBottom: 25 },
    submitButton: { marginTop: 40, marginBottom: 20 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 },
    optionRow: { marginVertical: 6 }
  }), [theme]);

  const openQuestion = (question: typeof questions[number]) => {
    setActiveQuestion(question);
    setModalVisible(true);
  };

  const handleToggle = (option: string) => {
    if (!activeQuestion) return;

    const prev = answers[activeQuestion.title] || [];

    if (activeQuestion.type === "checkbox") {
      // Toggle option
      const updated = prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option];
      setAnswers({ ...answers, [activeQuestion.title]: updated });
    } else {
      
      setAnswers({ ...answers, [activeQuestion.title]: [option] });
    }
  };

  const handleSubmit = () => {
    router.replace("/home")
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText weight="semibold" style={styles.title}>Please answer the questions below</ThemedText>
      <ThemedText weight="regular" style={styles.subtitle}>We'll use this to enhance your experience</ThemedText>

    {questions.map((q, i) => {
      const selected = answers[q.title] || [];

      let label: string;
      if (selected.length === 0) {
        label = `e.g ${q.options[0]}`;
      } else if (selected.length <= 2) {
        label = selected.join(", ");
      } else {
        const extraCount = selected.length - 2;
        label = `${selected.slice(0, 2).join(", ")} +${extraCount} more`;
      }

      return (
        <View key={i} style={styles.questionGroup}>
          <ThemedText weight="semibold" style={{ color: theme.primary, fontSize: 11 }}>
            {q.title}
          </ThemedText>
        <FormPressable
          label={label}
          onPress={() => openQuestion(q)}
          width={320}
          pressableStyle={{
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderWidth: 0.5,
            borderRadius: 15,
          }}
          labelStyle={{
            color: selected.length > 0 ? theme.text : '#9f9f9f'
          }}
        >
          <Feather name="chevron-down" size={20} color={theme.text} />
        </FormPressable>
        </View>
      );
    })}

      <View style={styles.submitButton}>
        <AnimatedButton onPress={handleSubmit} width={300} bgcolor={theme.primary}>
          Submit
        </AnimatedButton>
      </View>
<Modal
  visible={modalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setModalVisible(false)}
>
  <Pressable
    style={styles.modalOverlay}
    onPress={() => setModalVisible(false)}
  >
    <View style={styles.modalContent}>
      <ThemedText weight="semibold" style={{ marginBottom: 10 }}>Select</ThemedText>

      {activeQuestion?.options.map((opt, idx) => (
        <View key={idx} style={styles.optionRow}>
          <BouncyCheckbox
            size={20}
            fillColor={theme.primary}
            isChecked={answers[activeQuestion.title]?.includes(opt) || false}
            innerIconStyle={{
              borderWidth: 1,
              borderRadius: activeQuestion.type === "radio" ? 50 : 0,
            }}
            useBuiltInState
            text={opt}
            onPress={() => handleToggle(opt)}
            disableText={false}
            iconStyle={{
              borderRadius: activeQuestion.type === "radio" ? 50 : 0,
            }}
            textStyle={{ textDecorationLine: "none" }}
          />
        </View>
      ))}

      <TouchableOpacity
        style={{
          marginTop: 20,
          backgroundColor: theme.primary,
          padding: 10,
          borderRadius: 6,
        }}
        onPress={() => setModalVisible(false)}
      >
        <ThemedText weight="semibold" style={{ color: "white", textAlign: "center" }}>Done</ThemedText>
      </TouchableOpacity>
    </View>
  </Pressable>
</Modal>

    </ScrollView>
  );
}
