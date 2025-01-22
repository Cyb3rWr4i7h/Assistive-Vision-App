import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';

export default function VoiceAssistantScreen() {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e) => {
      if (e.value) {
        setSpokenText(e.value[0]);
        handleCommand(e.value[0]);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommand = (command) => {
    // Simple command handling logic
    const lowerCommand = command.toLowerCase();
    let responseText = '';

    if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
      responseText = 'Hello! How can I help you today?';
    } else if (lowerCommand.includes('time')) {
      responseText = `The current time is ${new Date().toLocaleTimeString()}`;
    } else if (lowerCommand.includes('help')) {
      responseText = 'I can help you with object detection, reading text, and navigation. What would you like to do?';
    } else {
      responseText = "I'm not sure how to help with that. Try asking for help to learn what I can do.";
    }

    setResponse(responseText);
    Speech.speak(responseText, {
      language: 'en',
      pitch: 1,
      rate: 0.8,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isListening ? 'Listening...' : 'Tap button to speak'}
        </Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.label}>You said:</Text>
        <Text style={styles.spokenText}>{spokenText}</Text>
        
        <Text style={styles.label}>Response:</Text>
        <Text style={styles.responseText}>{response}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isListening && styles.buttonListening]}
        onPressIn={startListening}
        onPressOut={stopListening}
      >
        <Text style={styles.buttonText}>
          {isListening ? 'Release to Stop' : 'Hold to Speak'}
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
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontSize: 18,
    color: '#666',
  },
  textContainer: {
    flex: 1,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  spokenText: {
    fontSize: 18,
    color: '#007bff',
    marginBottom: 20,
  },
  responseText: {
    fontSize: 18,
    color: '#28a745',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonListening: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
