import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Camera } from 'expo-camera';
import * as Speech from 'expo-speech';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function ObjectDetectionScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [detections, setDetections] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [model, setModel] = useState(null);
  const [isTfReady, setIsTfReady] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const cameraRef = useRef(null);
  const videoRef = useRef(null);

  // Initialize TensorFlow.js
  useEffect(() => {
    const initTensorFlow = async () => {
      try {
        await tf.ready();
        console.log('TensorFlow.js is ready');
        await tf.setBackend('webgl');
        console.log('WebGL backend is set');
        setIsTfReady(true);
      } catch (error) {
        console.error('Error initializing TensorFlow:', error);
      }
    };
    initTensorFlow();
  }, []);

  // Load COCO-SSD model
  useEffect(() => {
    if (!isTfReady) return;

    const loadModel = async () => {
      try {
        console.log('Loading COCO-SSD model...');
        const loadedModel = await cocoSsd.load();
        console.log('COCO-SSD model loaded successfully');
        setModel(loadedModel);
      } catch (error) {
        console.error('Error loading COCO-SSD model:', error);
      }
    };
    loadModel();
  }, [isTfReady]);

  // Setup camera
  useEffect(() => {
    const setupCamera = async () => {
      try {
        console.log('Requesting camera permission...');
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log('Camera permission status:', status);
        setHasPermission(status === 'granted');
        
        if (Platform.OS === 'web' && status === 'granted') {
          console.log('Setting up web camera...');
          
          // Set video constraints
          const constraints = {
            audio: false,
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: { ideal: 'environment' }
            }
          };

          try {
            // Get video stream
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Got media stream:', stream.getVideoTracks()[0].getSettings());
            
            // Wait for video element to be ready
            await new Promise(resolve => {
              const checkVideo = setInterval(() => {
                const video = videoRef.current;
                if (video) {
                  clearInterval(checkVideo);
                  resolve();
                }
              }, 100);
            });

            const video = videoRef.current;
            if (video) {
              // Reset video element
              video.srcObject = null;
              video.load();
              
              // Set up video element
              video.srcObject = stream;
              video.style.width = '100%';
              video.style.height = '100%';
              video.setAttribute('playsinline', '');
              video.setAttribute('autoplay', '');
              video.setAttribute('muted', '');
              
              // Force play
              try {
                await video.play();
                console.log('Video started playing');
              } catch (playError) {
                console.error('Error playing video:', playError);
                // Try playing again after a short delay
                setTimeout(async () => {
                  try {
                    await video.play();
                    console.log('Video started playing (retry)');
                  } catch (retryError) {
                    console.error('Error playing video (retry):', retryError);
                  }
                }, 1000);
              }
            }
          } catch (error) {
            console.error('Error setting up video stream:', error);
          }
        }
      } catch (error) {
        console.error('Error in camera setup:', error);
      }
    };

    setupCamera();
    
    // Cleanup
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.srcObject = null;
      }
      if (Platform.OS === 'web' && videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => {
          track.stop();
          console.log('Camera track stopped');
        });
      }
    };
  }, []);

  // Add function to calculate scaled coordinates
  const getScaledCoords = (bbox) => {
    if (!videoRef.current) return bbox;

    const videoEl = videoRef.current;
    const { videoWidth, videoHeight } = videoEl;
    const { clientWidth, clientHeight } = videoEl;

    // Calculate scaling factors
    const scaleX = clientWidth / videoWidth;
    const scaleY = clientHeight / videoHeight;

    return [
      bbox[0] * scaleX,  // x
      bbox[1] * scaleY,  // y
      bbox[2] * scaleX,  // width
      bbox[3] * scaleY   // height
    ];
  };

  // Update video dimensions when loaded
  useEffect(() => {
    const updateDimensions = () => {
      if (videoRef.current) {
        const { clientWidth, clientHeight } = videoRef.current;
        setVideoDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const detectObjects = async () => {
    console.log('Detect button pressed');
    if (!model || isProcessing || !isVideoReady) {
      console.log('Detection blocked:', { 
        noModel: !model, 
        isProcessing, 
        notVideoReady: !isVideoReady 
      });
      return;
    }
    
    setIsProcessing(true);
    console.log('Starting detection process');
    try {
      let predictions;
      
      if (Platform.OS === 'web') {
        console.log('Starting web detection');
        const video = videoRef.current;
        console.log('Video element:', {
          ready: video?.readyState,
          width: video?.videoWidth,
          height: video?.videoHeight
        });
        
        // Create a canvas to process the video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log('Frame captured');
        
        // Get predictions using COCO-SSD
        console.log('Running detection on canvas');
        predictions = await model.detect(canvas);
        console.log('Detection complete:', predictions);
      } else {
        if (!cameraRef.current) {
          console.log('No camera reference available');
          return;
        }
        const photo = await cameraRef.current.takePictureAsync({
          skipProcessing: true,
        });
        
        const image = new Image();
        await new Promise((resolve) => {
          image.onload = resolve;
          image.src = photo.uri;
        });
        
        predictions = await model.detect(image);
      }

      console.log('Setting detections:', predictions);
      setDetections(predictions);
      
      // Read out detected objects
      const objects = predictions
        .filter(pred => pred.score > 0.5) // Only include confident detections
        .map(pred => `${pred.class} with ${Math.round(pred.score * 100)}% confidence`)
        .join(', ');
        
      if (objects) {
        Speech.speak(`I can see: ${objects}`);
      } else {
        Speech.speak('No objects detected');
      }
    } catch (error) {
      console.error('Detection error:', error);
      Speech.speak('Error processing image');
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
      </View>
    );
  }

  if (!isTfReady || !model) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading TensorFlow.js and COCO-SSD model...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <View style={styles.container}>
          <video
            ref={videoRef}
            style={styles.camera}
            autoPlay
            playsInline
            muted
            onLoadedData={() => {
              console.log('Video loaded data');
              setIsVideoReady(true);
            }}
            onError={(e) => {
              console.error('Video error:', e);
            }}
          />
          
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              TF Ready: {isTfReady ? 'Yes' : 'No'}{'\n'}
              Model Loaded: {model ? 'Yes' : 'No'}{'\n'}
              Video Ready: {isVideoReady ? 'Yes' : 'No'}{'\n'}
              Processing: {isProcessing ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              onPress={() => {
                console.log('Button pressed');
                detectObjects();
              }}
              disabled={!isVideoReady || isProcessing}
              style={({pressed}) => [
                styles.button,
                (!isVideoReady || isProcessing) && styles.buttonDisabled,
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={styles.buttonText}>
                {isProcessing ? 'Detecting...' : 'Detect Objects'}
              </Text>
            </Pressable>
            <Text style={styles.status}>
              {!isVideoReady ? 'Waiting for camera...' : 'Camera ready'}
            </Text>
          </View>

          <View style={styles.detectionList}>
            {detections.map((detection, index) => (
              <Text key={index} style={styles.detectionItem}>
                {detection.class} ({Math.round(detection.score * 100)}%)
              </Text>
            ))}
          </View>

          <View style={styles.overlay}>
            {detections.map((detection, index) => {
              const scaledBbox = getScaledCoords(detection.bbox);
              return (
                <View
                  key={index}
                  style={[
                    styles.detectionBox,
                    {
                      left: scaledBbox[0],
                      top: scaledBbox[1],
                      width: scaledBbox[2],
                      height: scaledBbox[3],
                    }
                  ]}
                >
                  <Text style={styles.detectionText}>
                    {detection.class} ({Math.round(detection.score * 100)}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.back}
          ratio="4:3"
        >
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={detectObjects}
              disabled={isProcessing}
              style={({pressed}) => [
                styles.button,
                isProcessing && styles.buttonDisabled,
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={styles.buttonText}>
                {isProcessing ? 'Detecting...' : 'Detect Objects'}
              </Text>
            </Pressable>
          </View>
        </Camera>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  debugInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  detectionList: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
    maxWidth: '50%',
  },
  detectionItem: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  detectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'transparent',
  },
  detectionText: {
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
    color: '#000',
    fontSize: 12,
    padding: 4,
    position: 'absolute',
    top: -25,
  },
});
