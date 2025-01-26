import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';

export default function NavigationAssistantScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentDirection, setCurrentDirection] = useState('');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const startNavigation = async () => {
    setIsNavigating(true);
    // This is a placeholder for actual navigation logic
    const directions = [
      'Turn right in 10 meters',
      'Continue straight for 50 meters',
      'Your destination is on the left',
    ];


    let index = 0;
    const interval = setInterval(() => {
      if (index < directions.length) {
        const direction = directions[index];
        setCurrentDirection(direction);
        Speech.speak(direction, {
          language: 'en',
          pitch: 1,
          rate: 0.8,
        });
        index++;
      } else {
        clearInterval(interval);
        setIsNavigating(false);
      }
    }, 5000);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentDirection('');
    Speech.stop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : location ? (
          <Text style={styles.statusText}>
            Location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.statusText}>Getting location...</Text>
        )}
      </View>

      <View style={styles.directionContainer}>
        <Text style={styles.directionText}>{currentDirection}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isNavigating && styles.buttonStop]}
        onPress={isNavigating ? stopNavigation : startNavigation}
      >
        <Text style={styles.buttonText}>
          {isNavigating ? 'Stop Navigation' : 'Start Navigation'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  statusContainer: {
    marginBottom: 30,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  directionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonStop: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
