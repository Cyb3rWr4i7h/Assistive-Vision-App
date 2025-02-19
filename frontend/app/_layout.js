import { Tabs } from 'expo-router/tabs';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#f8f9fa' },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#6c757d',
        headerStyle: { backgroundColor: '#007bff' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="object-detection"
        options={{
          title: 'Object Detection',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="eye" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="color-detection"
        options={{
          title: 'Color Detection',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="palette" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="document-reader"
        options={{
          title: 'Document Reader',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="voice-assistant"
        options={{
          title: 'Voice Assistant',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="microphone" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="navigation-assistant"
        options={{
          title: 'Navigation',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="navigation" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
