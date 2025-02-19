import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const EmergencyContact = () => {
  const [emergencyNumber, setEmergencyNumber] = useState('');

  useEffect(() => {
    const loadEmergencyNumber = async () => {
      try {
        const savedNumber = await AsyncStorage.getItem('emergencyNumber');
        if (savedNumber) setEmergencyNumber(savedNumber);
      } catch (error) {
        console.error('Error loading emergency number:', error);
      }
    };
    loadEmergencyNumber();
  }, []);

  // Save the emergency number
  const saveEmergencyNumber = async () => {
    try {
      await AsyncStorage.setItem('emergencyNumber', emergencyNumber);
      Alert.alert('Saved!', 'Emergency contact has been updated.');
    } catch (error) {
      console.error('Error saving emergency number:', error);
    }
  };

  // Call the emergency contact
  const callEmergencyContact = () => {
    if (emergencyNumber) {
      Linking.openURL(`tel:${emergencyNumber}`).catch(err =>
        console.error('Error calling emergency contact:', err)
      );
    } else {
      Alert.alert('Error', 'No emergency contact saved.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Emergency Contact</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Emergency Number"
        keyboardType="phone-pad"
        value={emergencyNumber}
        onChangeText={setEmergencyNumber}
      />
      <TouchableOpacity style={styles.saveButton} onPress={saveEmergencyNumber}>
        <MaterialIcons name="save" size={24} color="white" />
        <Text style={styles.buttonText}>Save Number</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.emergencyButton} onPress={callEmergencyContact}>
        <MaterialIcons name="phone" size={24} color="white" />
        <Text style={styles.buttonText}>Call Emergency</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 10,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default EmergencyContact;
