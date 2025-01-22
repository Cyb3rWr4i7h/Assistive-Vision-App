import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen'; // Ensure this path is correct
import ObjectDetectionScreen from './screens/ObjectDetectionScreen'; // Ensure this path is correct
import TextReaderScreen from './screens/TextReaderScreen'; // Ensure this path is correct
import VoiceAssistantScreen from './screens/VoiceAssistantScreen'; // Ensure this path is correct
import NavigationAssistantScreen from './screens/NavigationAssistantScreen'; // Ensure this path is correct

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* <StatusBar style="auto" /> */}
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => {
          console.log(route.name); // Check if screen names are correctly passed
          return {
            tabBarStyle: { backgroundColor: '#f8f9fa' },
            tabBarActiveTintColor: '#007bff',
            tabBarInactiveTintColor: '#6c757d',
            headerStyle: { backgroundColor: '#007bff' },
            headerTintColor: '#fff',
          };
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Object Detection"
          component={ObjectDetectionScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="eye" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Text Reader"
          component={TextReaderScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="file-text" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Voice Assistant"
          component={VoiceAssistantScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="microphone" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Navigation Assistant"
          component={NavigationAssistantScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="navigation" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

    </NavigationContainer>
  );
}