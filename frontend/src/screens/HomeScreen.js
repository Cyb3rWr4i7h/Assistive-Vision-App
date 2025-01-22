import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to VisionAssist</Text>
      <Text style={styles.description}>
        Explore features like object detection, text reading, voice assistance, and navigation.
      </Text>
      <Button
        title="Start Object Detection"
        onPress={() => navigation.navigate('Object Detection')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#007bff',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
  },
});

export default HomeScreen;
