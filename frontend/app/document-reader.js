import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Dimensions } from 'react-native';
import * as Speech from 'expo-speech';
import * as DocumentPicker from 'expo-document-picker';
import * as pdfjsLib from 'pdfjs-dist';
import { router, useLocalSearchParams } from 'expo-router';

// Set up PDF.js worker
if (Platform.OS === 'web') {
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export default function DocumentReaderScreen() {
  const { extractedText: routeExtractedText } = useLocalSearchParams();
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [textChunks, setTextChunks] = useState([]);
  const shouldStopSpeech = useRef(false);
  const currentUtterance = useRef(null);

  useEffect(() => {
    if (routeExtractedText) {
      setExtractedText(routeExtractedText);
    }
  }, [routeExtractedText]);

  const stopSpeech = async () => {
    shouldStopSpeech.current = true;
    if (Platform.OS === 'web') {
      window.speechSynthesis.cancel();
    } else {
      await Speech.stop();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
  };

  const pauseSpeech = async () => {
    if (Platform.OS === 'web') {
      window.speechSynthesis.pause();
    } else {
      await Speech.pause();
    }
    setIsPaused(true);
  };

  const resumeSpeech = async () => {
    if (Platform.OS === 'web') {
      window.speechSynthesis.resume();
    } else {
      await Speech.resume();
    }
    setIsPaused(false);
  };

  const speakText = async (text) => {
    if (!text) return;
    
    if (isSpeaking) {
      if (isPaused) {
        await resumeSpeech();
        return;
      } else {
        await pauseSpeech();
        return;
      }
    }
    
    shouldStopSpeech.current = false;
    setIsSpeaking(true);
    setIsPaused(false);

    const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
    setTextChunks(chunks);
    setCurrentChunkIndex(0);

    if (Platform.OS === 'web') {
      const speakChunks = async (index = 0) => {
        if (shouldStopSpeech.current || index >= chunks.length) {
          setIsSpeaking(false);
          setCurrentChunkIndex(0);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        currentUtterance.current = utterance;
        
        utterance.onend = () => {
          if (!shouldStopSpeech.current && !isPaused) {
            setCurrentChunkIndex(index + 1);
            speakChunks(index + 1);
          }
        };

        utterance.onerror = (error) => {
          console.error('Speech Error:', error);
          setIsSpeaking(false);
          Alert.alert('Error', 'Failed to read text');
        };

        window.speechSynthesis.speak(utterance);
      };

      await speakChunks();
    } else {
      for (let i = 0; i < chunks.length; i++) {
        if (shouldStopSpeech.current) break;
        
        setCurrentChunkIndex(i);
        await Speech.speak(chunks[i].trim(), {
          onDone: () => {
            if (i === chunks.length - 1) {
              setIsSpeaking(false);
              setCurrentChunkIndex(0);
            }
          },
          onError: (error) => {
            console.error('Speech Error:', error);
            setIsSpeaking(false);
            Alert.alert('Error', 'Failed to read text');
          }
        });
      }
    }
  };

  const handleDocumentSelection = async () => {
    try {
      await stopSpeech();  // Stop any ongoing speech before selecting new document
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/', 'text/'],
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setIsProcessing(true);

      if (file.mimeType?.includes('pdf')) {
        if (Platform.OS === 'web') {
          // For web platform, create a blob URL for the PDF viewer
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const pdfBlobUrl = URL.createObjectURL(blob);
          setPdfUrl(pdfBlobUrl);

          try {
            // Load the PDF and extract text
            const pdfDoc = await pdfjsLib.getDocument(file.uri).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdfDoc.numPages; i++) {
              const page = await pdfDoc.getPage(i);
              const textContent = await page.getTextContent();
              fullText += textContent.items.map(item => item.str).join(' ') + '\n';
            }
            
            setPdfText(fullText);
            setExtractedText(fullText);
          } catch (error) {
            console.error('PDF text extraction error:', error);
            // Even if text extraction fails, we can still show the PDF
          }
        } else {
          Alert.alert('Error', 'PDF viewing is only supported on web platform');
        }
      } else if (file.mimeType?.includes('text/')) {
        // Handle text files
        const response = await fetch(file.uri);
        const text = await response.text();
        setExtractedText(text);
        setPdfText('');
        setPdfUrl(null);
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Document Selection Error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process document');
    }
  };

  const renderReadButton = () => (
    <View style={styles.buttonContainer}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => speakText(extractedText || pdfText)}
      >
        <Text style={styles.buttonText}>
          {!isSpeaking ? 'Read Text' : (isPaused ? 'Resume' : 'Pause')}
        </Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={async () => {
            await stopSpeech();
            router.push('/camera-screen');
          }}
        >
          <Text style={styles.buttonText}>📸 Open Camera</Text>
        </TouchableOpacity>

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
        <View style={styles.contentContainer}>
          <View style={styles.pdfContainer}>
            <iframe
              src={pdfUrl}
              style={styles.pdfViewer}
              title="PDF Viewer"
            />
          </View>
          <View style={styles.controlsContainer}>
            {renderReadButton()}
          </View>
        </View>
      ) : extractedText ? (
        <View style={styles.contentContainer}>
          <ScrollView style={styles.textContainer}>
            <Text style={styles.extractedText}>{extractedText}</Text>
          </ScrollView>
          <View style={styles.controlsContainer}>
            {renderReadButton()}
          </View>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Take a photo or select a document to get started
          </Text>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 10,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  pdfContainer: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    padding: 20,
    paddingBottom: 0,
  },
  pdfViewer: {
    width: '100%',
    height: '100%',
    border: '1px solid #ccc',
    borderRadius: 8,
  },
  controlsContainer: {
    width: '100%',
    padding: 20,
    paddingTop: 10,
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
  textContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },
  extractedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 18,
    color: '#666',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
});
