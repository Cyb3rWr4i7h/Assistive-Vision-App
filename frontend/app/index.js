import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import EmergencyContact from './emergency-contact';

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
      title: 'Color Detection',
      description: 'Detect colors from your camera',
      icon: 'palette',
      iconComponent: MaterialCommunityIcons,
      route: '/color-detection',
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
      <Text style={styles.description}>Your AI-powered assistant</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Emergency Contact Section */}
        <EmergencyContact />

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
      </ScrollView>
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
    marginBottom: 20,
    color: '#6c757d',
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
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
    marginTop: 10,
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
    padding: 15,
    borderRadius: 10,
    textAlign: 'center',
    color: '#6c757d',
  },
});
