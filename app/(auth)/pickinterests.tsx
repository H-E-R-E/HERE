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

const QUESTIONS: Question[] = [
  { 
    title: "What is your skill?", 
    options: ["Event Planner", "Videographer", "Photographer", "Vendor", "Dancer", "Designer", "Other"], 
    type: "checkbox" 
  },
  { 
    title: "What kinds of events are you interested in?", 
    options: ["Social Hangouts", "Tech", "Faith & Spiritual", "Music & Concerts", "Sports & Fitness", "Workshops & Training", "Business & Networking"], 
    type: "checkbox" 
  },
  { 
    title: "How do you prefer to attend events?", 
    options: ["Physically", "Virtually", "Both"], 
    type: "radio" 
  },
  { 
    title: "What are you looking for when you join an event?", 
    options: ["Fun", "Networking", "Friends", "Connections", "Business", "Partnership", "Knowledge"], 
    type: "checkbox" 
  },
];

export default function PickInterests() {
  const router = useRouter();
  const theme = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
      backgroundColor: theme.background,
    },
    headerContainer: {
      marginVertical: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.primary,
      textAlign: 'center',
      lineHeight: 36,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 15,
      color: theme.primary,
      opacity: 0.6,
      textAlign: 'center',
      lineHeight: 20,
    },
    questionsContainer: {
      marginBottom: 20,
    },
    questionGroup: {
      marginBottom: 20,
    },
    questionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
      marginBottom: 8,
    },
    buttonContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
      maxHeight: '80%',
    },
    modalHeader: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.primary,
      marginBottom: 20,
    },
    optionRow: {
      marginVertical: 12,
      paddingVertical: 4,
    },
    doneButton: {
      marginTop: 24,
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: 12,
    },
    doneButtonText: {
      color: 'white',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
  }), [theme]);

  const openQuestion = (question: Question) => {
    setActiveQuestion(question);
    setModalVisible(true);
  };

  const handleToggle = (option: string) => {
    if (!activeQuestion) return;

    const current = answers[activeQuestion.title] || [];

    if (activeQuestion.type === "checkbox") {
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      setAnswers({ ...answers, [activeQuestion.title]: updated });
    } else {
      setAnswers({ ...answers, [activeQuestion.title]: [option] });
    }
  };

  const handleSubmit = () => {
    router.replace("/(tabs)");
  };

  const formatLabel = (selected: string[]): string => {
    if (selected.length === 0) return "Select options";
    if (selected.length <= 2) return selected.join(", ");
    return `${selected.slice(0, 2).join(", ")} +${selected.length - 2} more`;
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <ThemedText weight="bold" style={styles.title}>
          Tell us about yourself
        </ThemedText>
        <ThemedText weight="regular" style={styles.subtitle}>
          We'll use this to enhance your experience
        </ThemedText>
      </View>

      {/* Questions */}
      <View style={styles.questionsContainer}>
        {QUESTIONS.map((question, idx) => {
          const selected = answers[question.title] || [];
          const label = formatLabel(selected);
          const isAnswered = selected.length > 0;

          return (
            <View key={idx} style={styles.questionGroup}>
              <ThemedText weight="semibold" style={styles.questionLabel}>
                {idx + 1}. {question.title}
              </ThemedText>
              <FormPressable
                label={label}
                onPress={() => openQuestion(question)}
                width="100%"
                pressableStyle={{
                  borderColor: isAnswered ? theme.primary : theme.border,
                  borderWidth: 1,
                  borderRadius: 12,
                }}
                backgroundColor={theme.inputBgColor}
                labelStyle={{
                  color: isAnswered ? theme.primary : '#999',
                  fontSize: 15,
                }}
              >
                <Feather 
                  name={modalVisible && activeQuestion === question ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.primary} 
                />
              </FormPressable>
            </View>
          );
        })}
      </View>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <AnimatedButton 
          onPress={handleSubmit} 
          width={300} 
          bgcolor={theme.primary}
        >
          Continue
        </AnimatedButton>
      </View>

      {/* Modal */}
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
            <ThemedText weight="semibold" style={styles.modalHeader}>
              {activeQuestion?.title}
            </ThemedText>

            {activeQuestion?.options.map((option, idx) => (
              <View key={idx} style={styles.optionRow}>
                <BouncyCheckbox
                  size={20}
                  fillColor={theme.primary}
                  isChecked={answers[activeQuestion.title]?.includes(option) || false}
                  innerIconStyle={{
                    borderWidth: 2,
                    borderRadius: activeQuestion.type === "radio" ? 50 : 4,
                  }}
                  iconStyle={{
                    borderRadius: activeQuestion.type === "radio" ? 50 : 4,
                    borderColor: theme.primary,
                  }}
                  text={option}
                  onPress={() => handleToggle(option)}
                  textStyle={{
                    textDecorationLine: "none",
                    fontSize: 15,
                    color: theme.primary,
                  }}
                  disableText={false}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText weight="semibold" style={styles.doneButtonText}>
                Done
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}