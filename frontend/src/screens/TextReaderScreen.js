import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Image } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import MlkitOcr from 'react-native-mlkit-ocr';

const TextReaderScreen = () => {
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState('');

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
    });

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);

      const recognizedText = await MlkitOcr.detectFromUri(uri);
      setText(recognizedText.map(item => item.text).join('\n'));
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Select Image" onPress={pickImage} />
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : null}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 16,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
});

export default TextReaderScreen;
