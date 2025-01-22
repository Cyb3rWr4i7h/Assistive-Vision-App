import React, { useState } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';

const VoiceAssistantScreen = () => {
  const [text, setText] = useState('');

  const startListening = () => {
    Voice.onSpeechResults = (event) => {
      const command = event.value[0];
      setText(command);

      if (command.includes('weather')) {
        Tts.speak('The weather is sunny with a temperature of 25°C.');
      } else if (command.includes('time')) {
        Tts.speak(`The time is ${new Date().toLocaleTimeString()}`);
      } else {
        Tts.speak('Sorry, I did not understand the command.');
      }
    };
    Voice.start('en-US');
  };

  return (
    <View style={styles.container}>
      <Button title="Start Listening" onPress={startListening} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
});

export default VoiceAssistantScreen;
