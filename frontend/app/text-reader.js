import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Camera } from 'expo-camera';
import * as Speech from 'expo-speech';

export default function TextReaderScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      
      // Placeholder for OCR processing
      // In a real implementation, you would send the image to a backend service
      // or use a local OCR library to process the image
      const demoText = "This is a sample text that would be extracted from the image.";
      setExtractedText(demoText);
      
      // Read the text aloud
      Speech.speak(demoText, {
        language: 'en',
        pitch: 1,
        rate: 0.8,
      });
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef}>
        <View style={styles.overlay} />
      </Camera>
      <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
        <Text style={styles.buttonText}>Capture Text</Text>
      </TouchableOpacity>
      <ScrollView style={styles.textContainer}>
        <Text style={styles.extractedText}>{extractedText}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  camera: {
    height: 300,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  captureButton: {
    backgroundColor: '#007bff',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    padding: 20,
  },
  extractedText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});
