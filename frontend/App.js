import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { SplashScreen } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  useEffect(() => {
    // Hide splash screen after initial navigation is complete
    SplashScreen.hideAsync();
    // Ignore specific warnings that might not be relevant
    LogBox.ignoreLogs(['Bridgeless mode is enabled']);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
      }}
    />
  );
}
