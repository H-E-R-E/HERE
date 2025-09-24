// components/CentralModal.tsx
import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,

} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons'; // Assuming you have @expo/vector-icons installed
import useThemeColors from '../app/hooks/useThemeColors'; // Adjust path as needed
import ThemedText from './ThemedText';

// Define the props for your CentralModal component
interface CentralModalProps {
  isVisible: boolean;
  onClose: () => void;
  headerText?: string;
  children: React.ReactNode; // Content to display in the main body of the modal
  headerButtonIcon?: React.ComponentProps<typeof Ionicons>['name']; // e.g., 'close', 'arrow-back'
  onHeaderButtonPress?: () => void;
  showBackdrop?: boolean; // Controls if the semi-transparent background is shown
  animationType?: 'none' | 'slide' | 'fade'; // Modal animation type
  hasBackdropDismiss?: boolean; // Controls if tapping outside dismisses the modal
}

const CentralModal: React.FC<CentralModalProps> = ({
  isVisible,
  onClose,
  headerText,
  children,
  headerButtonIcon,
  onHeaderButtonPress,
  showBackdrop = true,
  animationType = 'fade',
  hasBackdropDismiss = true,
}) => {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centeredView: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: showBackdrop
            ? 'rgba(0,0,0,0.5)'
            : 'transparent', // Semi-transparent backdrop
        },
        modalView: {
        paddingHorizontal: 10, // Adjust width as needed
          maxWidth: 400, // Max width for larger screens
          backgroundColor: theme.background, // Use theme background for modal
          borderRadius: 20,
          overflow: 'hidden', // Ensures content stays within rounded corners
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        },
        headerContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 15,
          backgroundColor: theme.background, // A slightly different background for the header
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerText: {
          fontSize: 18,
          color: theme.primary,
          flex: 1, // Allows text to take available space
          textAlign: 'center',
          marginLeft: 20 // Center the text by default
        },
        headerButton: {
          padding: 5,
          // Position absolute if you want the text centered and button outside its flow
          // If you want it in flow, text needs to push it
        },
        modalContent: {
          padding: 20,
          // flex: 1, // If content needs to stretch
        },
        backButton: {
          // This will ensure proper alignment for a back button on the left
          // while the headerText is centered and a close button is on the right.
          // You'd typically use 3 columns for this (left, center, right).
        }
      }),
    [theme, showBackdrop]
  );

  return (
    <Modal
      animationType={animationType}
      transparent={true}
      visible={isVisible}
      onRequestClose={hasBackdropDismiss ? onClose : undefined} // Android back button dismisses
    >
      <StatusBar style={theme.statusBar} translucent />
      <TouchableOpacity
        style={styles.centeredView}
        activeOpacity={1}
        onPress={hasBackdropDismiss ? onClose : undefined} // Tap outside to dismiss
        disabled={!hasBackdropDismiss}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalView}>
          
          <View style={styles.headerContainer}>
            {/* Optional Back Button - placed on the left */}
            {onHeaderButtonPress && headerButtonIcon === 'arrow-back' && (
              <TouchableOpacity onPress={onHeaderButtonPress} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={24} color={theme.primary} />
              </TouchableOpacity>
            )}

            {/* Header Text */}
            {headerText && (
              <ThemedText weight="semibold" style={styles.headerText}>
                {headerText}
              </ThemedText>
            )}

            {/* Optional Close Button - placed on the right */}
            {onHeaderButtonPress && headerButtonIcon !== 'arrow-back' && (
              <TouchableOpacity onPress={onHeaderButtonPress} style={styles.headerButton}>
                <Ionicons name={headerButtonIcon || 'close'} size={24} color={theme.primary} />
              </TouchableOpacity>
            )}
             {/* If no header button is specified, but headerText exists, add a placeholder for spacing */}
            {!onHeaderButtonPress && headerText && (
              <View style={{width: 24, height: 24}} /> // Match size of icon to keep text centered
            )}
          </View>

          {/* Modal Content */}
          <View style={styles.modalContent}>{children}</View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default CentralModal;