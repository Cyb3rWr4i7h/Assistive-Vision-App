import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { createWorker } from 'tesseract.js';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const cameraRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        try {
          const constraints = {
            video: {
              facingMode: 'environment'
            }
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          Alert.alert('Camera Error', 'Failed to access camera');
        }
      } else {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    })();

    return () => {
      // Cleanup camera resources
      if (Platform.OS === 'web' && videoRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
    };
  }, []);

  const processImage = async (imageData) => {
    setIsProcessing(true);
    try {
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const result = await worker.recognize(imageData);
      setExtractedText(result.data.text);
      
      await worker.terminate();
      
      // Navigate back to document reader with the extracted text
      router.push({
        pathname: "/document-reader",
        params: { extractedText: result.data.text }
      });
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Error', 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapture = async () => {
    try {
      if (Platform.OS === 'web') {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        if (!video) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        await processImage(imageDataUrl);
      } else if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        await processImage(photo.uri);
      }
    } catch (error) {
      console.error('Camera Error:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <View style={styles.cameraContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={styles.camera}
          />
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={Camera.Constants.Type.back}
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isProcessing && styles.buttonDisabled]} 
          onPress={handleCapture}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {isProcessing && (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing image...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cameraContainer: {
    height: Dimensions.get('window').height - 200,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});