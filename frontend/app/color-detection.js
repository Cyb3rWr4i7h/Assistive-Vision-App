import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import * as Speech from 'expo-speech';

export default function ColorDetectionScreen() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [dominantColor, setDominantColor] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false); // Track if the camera is ready
    const videoRef = useRef(null);

    // Load OpenCV.js
    useEffect(() => {
        if (Platform.OS === 'web') {
            const script = document.createElement('script');
            script.src = 'https://docs.opencv.org/4.8.0/opencv.js'; // Use version 4.8.0
            script.async = true;

            script.onload = () => {
                console.log('OpenCV.js loaded successfully');
                // Check if cv.matFromImageData exists
                if (typeof cv !== 'undefined' && typeof cv.matFromImageData === 'function') {
                    console.log('cv.matFromImageData is available');
                } else {
                    console.error('cv.matFromImageData is not available');
                }
            };

            script.onerror = () => {
                console.error('Failed to load OpenCV.js');
            };

            document.body.appendChild(script);
        }
    }, []);

    // Helper function to wait for OpenCV.js to be ready
    const isOpencvReady = () => {
        return new Promise((resolve) => {
            if (typeof cv !== 'undefined' && typeof cv.matFromImageData === 'function') {
                console.log('OpenCV.js is ready');
                resolve(true);
            } else {
                const interval = setInterval(() => {
                    if (typeof cv !== 'undefined' && typeof cv.matFromImageData === 'function') {
                        clearInterval(interval);
                        console.log('OpenCV.js is ready');
                        resolve(true);
                    }
                }, 100);
            }
        });
    };

    // Initialize the camera feed
    useEffect(() => {
        if (Platform.OS === 'web') {
            const setupCamera = async () => {
                try {
                    const constraints = {
                        video: { facingMode: 'environment' }, // Use rear camera
                    };
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;

                        // Wait for the video to load metadata
                        videoRef.current.onloadedmetadata = () => {
                            console.log('Video metadata loaded:', {
                                videoWidth: videoRef.current.videoWidth,
                                videoHeight: videoRef.current.videoHeight,
                            });
                            setIsCameraReady(true); // Mark the camera as ready
                        };

                        videoRef.current.play(); // Start playing the video feed
                    }
                } catch (error) {
                    console.error('Error accessing camera:', error);
                    Alert.alert('Error', 'Failed to access camera');
                }
            };

            setupCamera();

            // Cleanup when the component unmounts
            return () => {
                if (videoRef.current?.srcObject) {
                    const tracks = videoRef.current.srcObject.getTracks();
                    tracks.forEach((track) => track.stop());
                }
            };
        }
    }, []);

    // Function to detect dominant color using OpenCV.js
    const detectDominantColor = async () => {
        try {
            await isOpencvReady(); // Ensure OpenCV.js is ready

            const video = videoRef.current;
            if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
                console.error('Invalid video dimensions');
                throw new Error('Invalid video dimensions');
            }

            // Create a canvas to capture the current frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            console.log('Frame drawn on canvas');

            // Convert canvas image to OpenCV Mat
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const src = cv.matFromImageData(imgData); // Ensure this function exists
            console.log('Image converted to OpenCV Mat');

            // Convert to HSV color space for better color segmentation
            const hsv = new cv.Mat();
            cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);
            console.log('Image converted to HSV');

            // Define ranges for common colors (with alpha channel)
            const ranges = [
                { name: 'red', lower: [0, 100, 100, 255], upper: [10, 255, 255, 255] },
                { name: 'orange', lower: [11, 100, 100, 255], upper: [20, 255, 255, 255] },
                { name: 'yellow', lower: [21, 100, 100, 255], upper: [30, 255, 255, 255] },
                { name: 'green', lower: [35, 50, 50, 255], upper: [85, 255, 255, 255] },
                { name: 'blue', lower: [100, 100, 100, 255], upper: [130, 255, 255, 255] },
                { name: 'purple', lower: [131, 50, 50, 255], upper: [160, 255, 255, 255] },
                { name: 'pink', lower: [161, 50, 50, 255], upper: [170, 255, 255, 255] },
                { name: 'brown', lower: [10, 50, 50, 255], upper: [20, 200, 200, 255] },
                { name: 'cyan', lower: [86, 100, 100, 255], upper: [99, 255, 255, 255] },
                { name: 'magenta', lower: [171, 100, 100, 255], upper: [180, 255, 255, 255] },
                { name: 'beige', lower: [21, 50, 50, 255], upper: [30, 100, 100, 255] },
                { name: 'teal', lower: [90, 100, 100, 255], upper: [95, 255, 255, 255] },
                { name: 'lavender', lower: [150, 50, 50, 255], upper: [160, 150, 150, 255] },
                { name: 'maroon', lower: [0, 50, 50, 255], upper: [10, 100, 100, 255] },
                { name: 'navy', lower: [100, 50, 50, 255], upper: [110, 100, 100, 255] },
                { name: 'olive', lower: [31, 50, 50, 255], upper: [40, 100, 100, 255] },
                { name: 'coral', lower: [0, 50, 50, 255], upper: [10, 200, 200, 255] },
                { name: 'gold', lower: [21, 100, 100, 255], upper: [30, 255, 255, 255] },
                { name: 'violet', lower: [130, 50, 50, 255], upper: [140, 255, 255, 255] },
                { name: 'turquoise', lower: [85, 100, 100, 255], upper: [95, 255, 255, 255] },
                { name: 'indigo', lower: [110, 50, 50, 255], upper: [130, 255, 255, 255] },
                { name: 'white', lower: [0, 0, 200, 255], upper: [180, 30, 255, 255] }, // White range
                { name: 'black', lower: [0, 0, 0, 255], upper: [180, 255, 30, 255] }, // Black range
            ];

            let maxCount = 0;
            let dominantColorName = 'unknown';

            // Iterate through ranges to find the dominant color
            ranges.forEach(({ name, lower, upper }) => {
                const mask = new cv.Mat();
                const low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), lower);
                const high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), upper);
                cv.inRange(hsv, low, high, mask);

                const count = cv.countNonZero(mask);
                console.log(`Color: ${name}, Count: ${count}`);
                if (count > maxCount) {
                    maxCount = count;
                    dominantColorName = name;
                }

                mask.delete();
                low.delete();
                high.delete();
            });

            console.log('Dominant color detected:', dominantColorName);

            // Clean up OpenCV resources
            src.delete();
            hsv.delete();

            return dominantColorName;
        } catch (error) {
            console.error('Error detecting dominant color:', error);
            throw new Error('Failed to detect dominant color');
        }
    };

    // Handle photo capture
    const handleCapture = async () => {
        try {
            setIsProcessing(true);

            const video = videoRef.current;
            if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
                console.error('Video dimensions are invalid');
                Alert.alert('Error', 'Invalid video dimensions');
                return;
            }

            // Detect the dominant color
            const colorName = await detectDominantColor();
            setDominantColor(colorName);

            // Announce the detected color name
            Speech.speak(`The detected color is ${colorName}`);
        } catch (error) {
            console.error('Error capturing or processing image:', error);
            Alert.alert('Error', 'Failed to process image');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Camera Preview */}
            {Platform.OS === 'web' ? (
                <View style={styles.cameraContainer}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={styles.camera}
                    />
                    {!isCameraReady && (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading camera...</Text>
                        </View>
                    )}
                </View>
            ) : (
                <Text>Camera preview not supported on this platform</Text>
            )}

            {/* Detected Color Box */}
            {dominantColor && (
                <View style={[styles.colorBox, { backgroundColor: getHexColor(dominantColor) }]} />
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, isProcessing && styles.buttonDisabled]}
                    onPress={handleCapture}
                    disabled={!isCameraReady || isProcessing} // Disable button until the camera is ready
                >
                    <Text style={styles.buttonText}>
                        {isProcessing ? 'Detecting...' : 'Detect Color'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
            </View>

            {/* Processing Indicator */}
            {isProcessing && (
                <View style={styles.processingContainer}>
                    <Text style={styles.processingText}>Processing image...</Text>
                </View>
            )}
        </View>
    );
}

// Helper function to map color names to hex codes
const getHexColor = (colorName) => {
    const colorMap = {
        red: '#FF0000',
        orange: '#FFA500',
        yellow: '#FFFF00',
        green: '#00FF00',
        blue: '#0000FF',
        purple: '#800080',
        pink: '#FFC0CB',
        brown: '#A52A2A',
        cyan: '#00FFFF',
        magenta: '#FF00FF',
        beige: '#F5F5DC',
        teal: '#008080',
        lavender: '#E6E6FA',
        maroon: '#800000',
        navy: '#000080',
        olive: '#808000',
        coral: '#FF7F50',
        gold: '#FFD700',
        violet: '#EE82EE',
        turquoise: '#40E0D0',
        indigo: '#4B0082',
        white: '#FFFFFF',
        black: '#000000',
        unknown: '#FFFFFF',
    };
    return colorMap[colorName] || '#FFFFFF';
};

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
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    loadingText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    colorBox: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 100,
        height: 100,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#000',
    },
});