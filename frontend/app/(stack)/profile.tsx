import React, { useMemo, useEffect } from "react";
import { 
  ScrollView,
  StyleSheet, 
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AnimatedButton from "../../components/AnimatedButton";
import BlurryEllipse from "../../components/BlurryEllipse";
import InputField from "../../components/InputField";
import ThemedText from '../../components/ThemedText';
import useThemeColors from "../../app/hooks/useThemeColors";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const theme = useThemeColors();
  const router = useRouter();
  const { user, loading, fetchUserProfile } = useAuth();

  // Fetch fresh profile data when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleSave = () => {
    // Log original values
    console.log("Profile Data:", {
      fullName: user?.first_name && user?.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user?.username,
      email: user?.email,
      password: "********"
    });
    
    router.push("/(tabs)");
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        viewStyle: {
          top: 0,
          left: 0,
          position: "absolute",
        },
        scrollviewStyle: {
          flexGrow: 1,
          alignItems: "center",
          paddingVertical: 70,
          paddingHorizontal: 20,
          backgroundColor: theme.background,
        },
        avatarContainer: {
          marginTop: 40,
          marginBottom: 40,
          alignItems: "center",
          position: 'relative',
        },
        avatar: {
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 3,
          borderColor: theme.primary,
        },
        avatarPlaceholder: {
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 3,
          borderColor: theme.primary,
          backgroundColor: theme.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        editIconContainer: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          backgroundColor: theme.primary,
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: theme.background,
        },
        inputContainer: {
          width: '100%',
          maxWidth: 340,
          marginBottom: 10,
          marginLeft: 30,
        },
        inputStyles: {
          backgroundColor: theme.background,
        },
        buttonContainer: {
          width: '100%',
          maxWidth: 340,
          marginTop: 10,
          marginLeft: 5, 
        },
      }),
    [theme]
  );

  if (loading) {
    return (
      <View style={[styles.scrollviewStyle, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.scrollviewStyle, { justifyContent: 'center' }]}>
        <ThemedText>Error loading profile</ThemedText>
        <AnimatedButton 
          onPress={() => router.replace("/(auth)/login")}
          width={200}
          marginBottom={0}
        >
          Go to Login
        </AnimatedButton>
      </View>
    );
  }

  const getInitials = () => {
    const firstInitial = user.first_name?.[0] || user.username[0];
    const lastInitial = user.last_name?.[0] || user.username[1] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  const fullName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.username;

  return (
    <>
      <StatusBar style={theme.statusBar} translucent />
      <ScrollView contentContainerStyle={styles.scrollviewStyle}>
        <View style={styles.viewStyle}>
          <BlurryEllipse />
        </View>

        <View style={styles.avatarContainer}>
          {user.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <ThemedText style={{ fontSize: 48 }} weight="bold">
                {getInitials()}
              </ThemedText>
            </View>
          )}
          <TouchableOpacity style={styles.editIconContainer}>
            <Ionicons name="pencil" size={20} color={theme.background} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <InputField
            placeholder="Full Name"
            value={fullName}
            onChangeText={() => {}}
            inputStyle={styles.inputStyles}
          />
        </View>

        <View style={styles.inputContainer}>
          <InputField
            placeholder="Email"
            value={user.email}
            onChangeText={() => {}}
            inputStyle={styles.inputStyles}
          />
        </View>

        <View style={styles.inputContainer}>
          <InputField
            placeholder="Password"
            value="********"
            onChangeText={() => {}}
            inputStyle={styles.inputStyles}
          />
        </View>
s        <View style={styles.buttonContainer}>
          <AnimatedButton 
            onPress={handleSave}
            width={340}
            marginBottom={0}
          >
            Save Changes
          </AnimatedButton>
        </View>
      </ScrollView>
    </>
  );
}