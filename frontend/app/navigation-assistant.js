import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import Voice from '@react-native-voice/voice';

export default function NavigationAssistantScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [destination, setDestination] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

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

    if (Platform.OS === 'web') {
      setupWebVoiceRecognition();
    } else {
      setupNativeVoiceRecognition();
    }

    return () => {
      if (Platform.OS === 'web') {
        if (recognition) {
          recognition.stop();
        }
      } else {
        Voice.destroy().then(Voice.removeAllListeners);
      }
    };
  }, []);

  const setupWebVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => setIsListening(true);
      recognitionInstance.onend = () => setIsListening(false);
      recognitionInstance.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setDestination(text);
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  };

  const setupNativeVoiceRecognition = () => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = onSpeechResults;
  };

  const onSpeechResults = (event) => {
    if (event.value && event.value.length > 0) {
      setDestination(event.value[0]);
    }
  };

  const startVoiceInput = async () => {
    try {
      if (Platform.OS === 'web') {
        if (recognition) {
          recognition.start();
        } else {
          Alert.alert('Error', 'Voice recognition not supported in this browser');
        }
      } else {
        await Voice.start('en-US');
      }
    } catch (error) {
      console.error('Voice Input Error:', error);
      Alert.alert('Error', 'Could not start voice recognition.');
    }
  };

  const stopVoiceInput = async () => {
    try {
      if (Platform.OS === 'web') {
        if (recognition) {
          recognition.stop();
        }
      } else {
        await Voice.stop();
      }
    } catch (error) {
      console.error('Voice Stop Error:', error);
    }
  };

  const redirectToGoogleMaps = () => {
    if (!destination) {
      Alert.alert('Error', 'Please provide a destination.');
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    Linking.openURL(url).catch((err) => {
      Alert.alert('Error', 'Failed to open Google Maps.');
      console.error(err);
    });
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

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Destination:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter destination or use voice input"
          value={destination}
          onChangeText={setDestination}
        />
        <TouchableOpacity 
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPressIn={startVoiceInput}
          onPressOut={stopVoiceInput}
        >
          <Text style={styles.voiceButtonText}>
            {isListening ? '🎤 Listening...' : '🎤 Hold to Speak'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={redirectToGoogleMaps}>
        <Text style={styles.buttonText}>Start Navigation</Text>
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
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  voiceButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#dc3545',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
