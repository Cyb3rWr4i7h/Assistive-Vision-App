import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

export default function ObjectDetectionScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [detections, setDetections] = useState([]);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Initialize TensorFlow.js
      await tf.ready();
      const model = await cocossd.load();
    })();
  }, []);

  const handleDetection = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });
      
      // Convert image to tensor and run detection
      // This is a placeholder - actual implementation would need proper image processing
      setDetections([{ class: 'Object detected', score: 0.95 }]);
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
        <View style={styles.overlay}>
          {detections.map((detection, index) => (
            <Text key={index} style={styles.detectionText}>
              {detection.class} ({Math.round(detection.score * 100)}%)
            </Text>
          ))}
        </View>
      </Camera>
      <TouchableOpacity style={styles.button} onPress={handleDetection}>
        <Text style={styles.buttonText}>Detect Objects</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },
  detectionText: {
    backgroundColor: 'rgba(0, 123, 255, 0.7)',
    color: 'white',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  button: {
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
});
