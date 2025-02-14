import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';

export default function Home() {
  const router = useRouter();
  
  const features = [
    {
      title: 'Object Detection',
      description: 'Identify objects in your surroundings',
      icon: 'eye',
      iconComponent: MaterialCommunityIcons,
      route: '/object-detection',
    },
    {
      title: 'Document Reader',
      description: 'Read text from images and documents',
      icon: 'file-text',
      iconComponent: FontAwesome,
      route: '/document-reader',
    },
    {
      title: 'Voice Assistant',
      description: 'Voice commands and responses',
      icon: 'microphone',
      iconComponent: MaterialCommunityIcons,
      route: '/voice-assistant',
    },
    {
      title: 'Navigation Assistant',
      description: 'Help with navigation and directions',
      icon: 'navigation',
      iconComponent: MaterialIcons,
      route: '/navigation-assistant',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Assistive Vision App</Text>
      <Text style={styles.description}>
        Your AI-powered assistant
      </Text>
      
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={styles.featureButton}
            onPress={() => router.push(feature.route)}
          >
            <feature.iconComponent name={feature.icon} size={32} color="#007bff" />
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007bff',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6c757d',
  },
  featuresContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#343a40',
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6c757d',
  },
});
