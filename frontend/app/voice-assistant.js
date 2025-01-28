import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';

// Only import Speech on native platforms
const Speech = Platform.OS === 'web' ? null : require('expo-speech');

export default function VoiceAssistantScreen() {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [response, setResponse] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = async (text) => {
    if (Platform.OS === 'web') {
      // Use Web Speech API for synthesis
      if (window.speechSynthesis) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.pitch = 1;
        utterance.rate = 0.8;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported in this browser');
      }
    } else if (Speech) {
      // Use Expo Speech for native platforms
      try {
        setIsSpeaking(true);
        await Speech.speak(text, {
          language: 'en',
          pitch: 1,
          rate: 0.8,
          onDone: () => setIsSpeaking(false),
          onError: (error) => {
            console.error('Error speaking:', error);
            setIsSpeaking(false);
          },
        });
      } catch (error) {
        console.error('Error speaking:', error);
        setIsSpeaking(false);
      }
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web Speech API setup
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
          setSpokenText(text);
          handleCommand(text);
        };

        setRecognition(recognitionInstance);
      } else {
        console.warn('Speech recognition not supported in this browser');
      }
    } else {
      // Native platform setup
      Voice.onSpeechStart = () => setIsListening(true);
      Voice.onSpeechEnd = () => setIsListening(false);
      Voice.onSpeechResults = (e) => {
        if (e.value) {
          setSpokenText(e.value[0]);
          handleCommand(e.value[0]);
        }
      };
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

  const startListening = async () => {
    try {
      if (Platform.OS === 'web') {
        if (recognition) {
          recognition.start();
        } else {
          console.warn('Speech recognition not initialized');
        }
      } else {
        await Voice.start('en-US');
      }
    } catch (e) {
      console.error('Error starting voice recognition:', e);
    }
  };

  const stopListening = async () => {
    try {
      if (Platform.OS === 'web') {
        if (recognition) {
          recognition.stop();
        }
      } else {
        await Voice.stop();
      }
    } catch (e) {
      console.error('Error stopping voice recognition:', e);
    }
  };

  const handleCommand = (command) => {
    // Simple command handling logic
    const lowerCommand = command.toLowerCase();
    let responseText = '';

    if (lowerCommand.includes('hello') || lowerCommand.includes('hi')) {
      responseText = 'Hello! How can I help you today?';
    } else if (lowerCommand.includes('time')) {
      responseText = 'The current time is ${new Date().toLocaleTimeString()}';
    } else if (lowerCommand.includes('help')) {
      responseText = 'I can help you with object detection, reading text, and navigation. What would you like to do?';
    } else {
      responseText = "I'm not sure how to help with that. Try asking for help to learn what I can do.";
    }

    setResponse(responseText);
    speak(responseText);
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
