// app/(tabs)/home/screens/_layout.tsx

import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="PersonalInfoScreen"
        options={{
          headerShown: false,
          title: "Personal Information"
        }}
      />
      <Stack.Screen
        name="SavedAddressesScreen"
        options={{
          headerShown: false,
          title: "Saved Addresses"
        }}
      />
      <Stack.Screen
        name="SecurityScreen"
        options={{
          headerShown: true,
          title: "Security",
          headerBackTitle: "Back"
        }}
      />
      {/* Add the new security-related screens */}
      <Stack.Screen
        name="ChangePasswordScreen"
        options={{
          headerShown: true,
          title: "Change Password",
          headerBackTitle: "Security"
        }}
      />
      <Stack.Screen
        name="TwoFactorAuthScreen"
        options={{
          headerShown: true,
          title: "Two-Factor Authentication",
          headerBackTitle: "Security"
        }}
      />
    </Stack>
  );
}