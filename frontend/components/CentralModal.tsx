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
import Ionicons from '@expo/vector-icons/Ionicons'; 
import useThemeColors from '../app/hooks/useThemeColors'; 
import ThemedText from './ThemedText';

// Define the props for your CentralModal component
interface CentralModalProps {
  isVisible: boolean;
  onClose: () => void;
  headerText?: string;
  children: React.ReactNode;
  headerButtonIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onHeaderButtonPress?: () => void;
  showBackdrop?: boolean;
  animationType?: 'none' | 'slide' | 'fade'; 
  hasBackdropDismiss?: boolean;
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
        backgroundColor: showBackdrop ? 'rgba(0,0,0,0.5)' : 'transparent',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
        modalView: {
          maxWidth: 400, 
          backgroundColor: theme.background, 
          borderRadius: 20,
          overflow: 'hidden',
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
          backgroundColor: theme.background, 
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerText: {
          fontSize: 14,
          color: theme.primary,
          flex: 1, 
          textAlign: 'center',
          marginLeft: 30 
        },
        headerButton: {
          padding: 5,
        },
        modalContent: {
          padding: 20,
        },
        backButton: {
        }
      }),
    [theme, showBackdrop]
  );

  return (
    <Modal
      animationType={animationType}
      transparent={true}
      visible={isVisible}
      onRequestClose={hasBackdropDismiss ? onClose : undefined}
       statusBarTranslucent={true}
    >
      <StatusBar translucent backgroundColor="transparent" />
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