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
    </Stack>
  );
}