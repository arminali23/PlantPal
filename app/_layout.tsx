import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { requestNotificationPermissions } from '../services/notifications';

export default function RootLayout() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="plant/[id]"
        options={{
          title: 'Plant Details',
          headerStyle: { backgroundColor: '#F0FDF4' },
          headerTintColor: '#16A34A',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
    </Stack>
  );
}
