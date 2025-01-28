import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Dimensions, Linking } from 'react-native';
import { Camera } from 'expo-camera';
import * as Speech from 'expo-speech';
import * as DocumentPicker from 'expo-document-picker';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
if (Platform.OS === 'web') {
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export default function DocumentReaderScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [cameraVisible, setCameraVisible] = useState(true);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [textChunks, setTextChunks] = useState([]);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const shouldStopSpeech = useRef(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasPermission(true);
        } catch (err) {
          console.error('Camera permission error:', err);
          setHasPermission(false);
        }
      } else {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    })();

    return () => {
      if (Platform.OS === 'web' && videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize Tesseract worker
  const initializeTesseract = async () => {
    const worker = await createWorker({
      logger: message => console.log(message)
    });
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    return worker;
  };

  // Process image using Tesseract OCR
  const processImage = async (uri) => {
    try {
      setIsProcessing(true);
      setCameraVisible(false);
      const worker = await initializeTesseract();
      const { data: { text } } = await worker.recognize(uri);
      await worker.terminate();
      setExtractedText(text);
      setPdfUrl(null);
      setIsProcessing(false);
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('Error', 'Failed to process image');
      setIsProcessing(false);
    }
  };

  // Process PDF and extract text
  const extractPdfText = async (pdfData) => {
    try {
      console.log('Extracting PDF text...');
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `Page ${i}:\n${pageText}\n\n`;
      }

      console.log('Extracted PDF text length:', fullText.length);
      return fullText;
    } catch (error) {
      console.error('PDF text extraction error:', error);
      throw error;
    }
  };

  // Process PDF
  const processPDF = async (uri) => {
    try {
      setIsProcessing(true);
      setCameraVisible(false);
      
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (Platform.OS === 'web') {
        // Create URL for PDF viewer
        const objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);

        // Extract text from PDF
        const arrayBuffer = await blob.arrayBuffer();
        const text = await extractPdfText(arrayBuffer);
        if (text.trim()) {
          console.log('Successfully extracted text from PDF');
          setPdfText(text);
          setExtractedText(text);
        } else {
          console.log('No text extracted from PDF');
          setExtractedText('No readable text found in PDF');
        }
      } else {
        await Linking.openURL(uri);
        setExtractedText('PDF opened in external viewer');
      }
    } catch (error) {
      console.error('PDF Error:', error);
      Alert.alert('Error', 'Failed to process PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const splitTextIntoChunks = (text) => {
    // Split text into sentences, then group into chunks
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    sentences.forEach((sentence) => {
      if (currentChunk.length + sentence.length > 200) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    });
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  };

  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    
    // Remove empty pages and excessive whitespace
    const cleanText = text
      .split('\n')
      .filter(line => line.trim().length > 0)  // Remove empty lines
      .map(line => {
        // Remove page markers if they're empty
        if (line.match(/^Page \d+:$/)) return '';
        // Clean up the line
        return line.trim()
          .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
          .replace(/[^\w\s.,!?-]/g, ' '); // Replace special characters with space
      })
      .filter(line => line.length > 0)  // Remove empty lines again
      .join('. ');  // Join with periods for better speech pauses

    console.log('Cleaned text sample:', cleanText.substring(0, 100));
    return cleanText;
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

  const toggleCamera = async () => {
    try {
      // Stop any ongoing speech before switching
      await stopSpeech();
      
      setCameraVisible(prev => !prev);
      if (!cameraVisible) {
        // Clearing state when going back to camera
        setExtractedText('');
        setPdfText('');
        setPdfUrl(null);
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  const renderCameraToggle = () => (
    <TouchableOpacity
      style={[styles.button, styles.cameraButton]}
      onPress={toggleCamera}
    >
      <Text style={styles.buttonText}>
        {cameraVisible ? 'View Document' : 'Back to Camera'}
      </Text>
    </TouchableOpacity>
  );

  const handleDocumentSelection = async () => {
    try {
      // Stop any ongoing speech before selecting new document
      await stopSpeech();

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/*'],
        multiple: false,
      });

      if (result.canceled) {
        console.log('Document selection cancelled');
        return;
      }

      const file = result.assets[0];
      console.log('Selected document:', file);
      
      setIsProcessing(true);
      setCameraVisible(false);

      if (file.mimeType === 'application/pdf') {
        await processPDF(file.uri);
      } else if (file.mimeType?.startsWith('text/')) {
        const response = await fetch(file.uri);
        const text = await response.text();
        setExtractedText(text);
        setPdfUrl(null);
        // Automatically read the text file content
        await toggleSpeech();
      }
    } catch (error) {
      console.error('Document Selection Error:', error);
      Alert.alert('Error', 'Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/', 'application/pdf', 'text/']
      });

      if (!result.assets || result.canceled) return;

      const { uri, mimeType } = result.assets[0];
      console.log('Selected document:', { uri, mimeType });
      
      setIsProcessing(true);
      setCameraVisible(false);

      if (mimeType?.startsWith('image/')) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        await processImage(imageUrl);
        // Automatically read the extracted text
        if (extractedText) {
          await toggleSpeech();
        }
      } else if (mimeType === 'application/pdf') {
        await processPDF(uri);
      } else if (mimeType?.startsWith('text/')) {
        const response = await fetch(uri);
        const text = await response.text();
        setExtractedText(text);
        setPdfUrl(null);
        // Automatically read the text file content
        await toggleSpeech();
      }
    } catch (error) {
      console.error('Document Selection Error:', error);
      Alert.alert('Error', 'Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopSpeech = async () => {
    try {
      console.log('Stopping speech completely...');
      shouldStopSpeech.current = true;
      
      if (Platform.OS === 'web') {
        // Cancel all pending utterances
        window.speechSynthesis.cancel();
        
        // Reset the speech synthesis if it's stuck
        setTimeout(() => {
          window.speechSynthesis.resume();
          window.speechSynthesis.cancel();
        }, 50);
      } else {
        await Speech.stop();
      }
      
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentChunkIndex(0);
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  };

  const toggleSpeech = async () => {
    try {
      const rawText = extractedText || pdfText;
      console.log('Toggle speech called with text length:', rawText?.length);
      
      if (isSpeaking) {
        if (isPaused) {
          console.log('Resuming speech...');
          shouldStopSpeech.current = false;
          if (Platform.OS === 'web') {
            window.speechSynthesis.resume();
          } else {
            // For non-web platforms, start from where we left off
            const remainingText = cleanTextForSpeech(rawText.substring(currentChunkIndex));
            await Speech.speak(remainingText, {
              language: 'en',
              pitch: 1,
              rate: 0.8,
              onDone: () => {
                if (!shouldStopSpeech.current) {
                  setIsSpeaking(false);
                  setIsPaused(false);
                  setCurrentChunkIndex(0);
                }
              },
              onError: (error) => {
                console.error('Speech error:', error);
                setIsSpeaking(false);
                setIsPaused(false);
                setCurrentChunkIndex(0);
                Alert.alert('Error', 'Failed to read text');
              },
            });
          }
          setIsPaused(false);
        } else {
          console.log('Pausing speech...');
          if (Platform.OS === 'web') {
            window.speechSynthesis.pause();
          } else {
            await Speech.stop();
          }
          setIsPaused(true);
        }
      } else if (rawText) {
        console.log('Starting new speech...');
        const cleanedText = cleanTextForSpeech(rawText);
        
        if (!cleanedText) {
          console.log('No readable text found after cleaning');
          Alert.alert('Error', 'No readable text found in the document');
          return;
        }

        shouldStopSpeech.current = false;
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentChunkIndex(0);
        
        if (Platform.OS === 'web') {
          // Clear any existing speech
          window.speechSynthesis.cancel();
          
          // Split text into smaller chunks for better reliability
          const chunks = cleanedText.match(/[^.!?]+[.!?]+/g) || [cleanedText];
          console.log('Split into', chunks.length, 'chunks');
          
          const speakChunks = async (startIndex = 0) => {
            if (shouldStopSpeech.current) {
              console.log('Speech stopped by user');
              return;
            }

            if (startIndex < chunks.length) {
              const utterance = new SpeechSynthesisUtterance(chunks[startIndex]);
              utterance.rate = 0.8;
              utterance.pitch = 1;
              utterance.lang = 'en-US';
              
              utterance.onend = () => {
                if (!isPaused && !shouldStopSpeech.current) {
                  speakChunks(startIndex + 1);
                }
              };
              
              utterance.onerror = (event) => {
                // Only log error if it's not from stopping the speech
                if (event.error !== 'interrupted' || !shouldStopSpeech.current) {
                  console.error('Speech error at chunk', startIndex, ':', event);
                }
                // Continue with next chunk if it wasn't stopped by user
                if (!isPaused && !shouldStopSpeech.current) {
                  speakChunks(startIndex + 1);
                }
              };
              
              window.speechSynthesis.speak(utterance);
            } else {
              console.log('Finished speaking all chunks');
              if (!shouldStopSpeech.current) {
                setIsSpeaking(false);
                setIsPaused(false);
                setCurrentChunkIndex(0);
              }
            }
          };
          
          await speakChunks();
        } else {
          await Speech.speak(cleanedText, {
            language: 'en',
            pitch: 1,
            rate: 0.8,
            onDone: () => {
              if (!shouldStopSpeech.current) {
                console.log('Speech completed');
                setIsSpeaking(false);
                setIsPaused(false);
                setCurrentChunkIndex(0);
              }
            },
            onError: (error) => {
              console.error('Speech error:', error);
              setIsSpeaking(false);
              setIsPaused(false);
              setCurrentChunkIndex(0);
              Alert.alert('Error', 'Failed to read text');
            },
          });
        }
      } else {
        console.log('No text available to read');
        Alert.alert('Error', 'No text available to read');
      }
    } catch (error) {
      console.error('Speech Error:', error);
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentChunkIndex(0);
      Alert.alert('Error', 'Failed to process speech');
    }
  };

  useEffect(() => {
    // Cleanup speech when component unmounts
    return () => {
      stopSpeech();
    };
  }, []);

  const renderReadButton = () => {
    const hasText = extractedText || pdfText;
    if (!hasText) return null;

    let buttonText = 'Read Text';
    if (isSpeaking) {
      buttonText = isPaused ? 'Resume' : 'Pause';
    }

    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.readButton, 
            isSpeaking && !isPaused && styles.buttonActive,
            isPaused && styles.buttonPaused
          ]} 
          onPress={toggleSpeech}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
        {isSpeaking && (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]} 
            onPress={stopSpeech}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {cameraVisible && (
        <View style={styles.cameraContainer}>
          {Platform.OS === 'web' ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <View style={styles.overlay}>
                <TouchableOpacity 
                  style={styles.captureButton} 
                  onPress={handleCapture}
                >
                  <Text style={styles.captureButtonText}>📸</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Camera 
              style={styles.camera} 
              ref={cameraRef}
              type={Camera.Constants.Type.back}
            >
              <View style={styles.overlay}>
                <TouchableOpacity 
                  style={styles.captureButton} 
                  onPress={handleCapture}
                >
                  <Text style={styles.captureButtonText}>📸</Text>
                </TouchableOpacity>
              </View>
            </Camera>
          )}
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        {!cameraVisible && renderCameraToggle()}
        <TouchableOpacity 
          style={[styles.button, isProcessing && styles.buttonDisabled]} 
          onPress={handleDocumentSelection}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>Select Document</Text>
        </TouchableOpacity>
      </View>

      {isProcessing ? (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing document...</Text>
        </View>
      ) : pdfUrl && Platform.OS === 'web' ? (
        <>
          <iframe
            src={pdfUrl}
            style={{
              width: '100%',
              height: '500px',
              border: 'none'
            }}
            title="PDF Viewer"
          />
          {renderReadButton()}
        </>
      ) : extractedText ? (
        <>
          <ScrollView style={styles.textContainer}>
            <Text style={styles.extractedText}>{extractedText}</Text>
          </ScrollView>
          {renderReadButton()}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cameraContainer: {
    height: 400,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  captureButtonText: {
    fontSize: 36,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-around',
    padding: 20,
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
  buttonActive: {
    backgroundColor: '#28a745',
  },
  buttonPaused: {
    backgroundColor: '#ffc107',
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
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#666',
  },
  readButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  cameraButton: {
    backgroundColor: '#007bff',
  },
});
