import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const VoiceAssistant = () => {
  const [response, setResponse] = useState('');
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (transcript.includes('weather')) {
      setResponse('Fetching the weather...');
    } else if (transcript.includes('time')) {
      setResponse(new Date().toLocaleTimeString());
    }
  }, [transcript]);

  return (
    <div>
      <h2>AI Assistant</h2>
      <button onClick={() => SpeechRecognition.startListening()}>
        {listening ? 'Listening...' : 'Start'}
      </button>
      <p>Transcript: {transcript}</p>
      <p>Response: {response}</p>
      <button onClick={resetTranscript}>Reset</button>
    </div>
  );
};

export default VoiceAssistant;
