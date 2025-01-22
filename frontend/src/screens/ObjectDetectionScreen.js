import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

const ObjectDetectionScreen = () => {
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getPermissions();
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = await cocossd.load();
        setLoading(false);

        const detect = async () => {
          if (!cameraRef.current) return;
          const image = await cameraRef.current.takePictureAsync();
          const predictions = await model.detect(tf.browser.fromPixels(image));
          setPredictions(predictions);
        };

        setInterval(detect, 2000); // Detect objects every 2 seconds
      } catch (err) {
        console.error("Error loading TensorFlow model", err);
      }
    };

    loadModel();
  }, []);

  if (hasPermission === null) {
    return <ActivityIndicator size="large" color="#007bff" />;
  }

  if (hasPermission === false) {
    Alert.alert('Permission Denied', 'Camera permission is required to use this feature.');
    return null;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef} />
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <View style={styles.predictions}>
          {predictions.map((prediction, index) => (
            <Text key={index} style={styles.predictionText}>
              {prediction.class}: {Math.round(prediction.score * 100)}%
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '70%',
  },
  loader: {
    marginTop: 16,
  },
  predictions: {
    padding: 16,
  },
  predictionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ObjectDetectionScreen;
