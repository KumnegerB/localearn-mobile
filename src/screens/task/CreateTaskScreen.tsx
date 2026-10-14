import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useTaskStore } from '../../store/useTaskStore';

import { SUPPORTED_CURRENCIES } from '../../utils/currency';

const CATEGORIES = ['Home & Yard', 'Moving', 'Delivery', 'Pet Care', 'Tech Help', 'General'];

export const CreateTaskScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  const { createTask, isLoading } = useTaskStore();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          setLocationName('Current Location');
        } else {
          setCoords({ latitude: 37.7749, longitude: -122.4194 });
          setLocationName('Downtown');
        }
      } catch {
        setCoords({ latitude: 37.7749, longitude: -122.4194 });
        setLocationName('Downtown');
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !budget.trim()) {
      Alert.alert('Required Fields', 'Please complete title, description, and budget.');
      return;
    }

    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid amount.');
      return;
    }

    const task = await createTask({
      title: title.trim(),
      description: description.trim(),
      budget: numBudget,
      currency,
      category,
      location_name: locationName.trim() || 'Neighborhood',
      latitude: coords?.latitude || 37.7749,
      longitude: coords?.longitude || -122.4194,
    });

    if (task) {
      Alert.alert('Task Posted!', 'Your task is now visible to nearby neighbors.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Task Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Help moving a heavy sofa"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catPill, category === cat && styles.activeCatPill]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catText, category === cat && styles.activeCatText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Select Currency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {SUPPORTED_CURRENCIES.map((curr) => (
          <TouchableOpacity
            key={curr.code}
            style={[styles.catPill, currency === curr.code && styles.activeCatPill]}
            onPress={() => setCurrency(curr.code)}
          >
            <Text style={[styles.catText, currency === curr.code && styles.activeCatText]}>
              {curr.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Budget Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 50"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Location / Neighborhood</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Maple Street & 4th Ave"
        value={locationName}
        onChangeText={setLocationName}
      />

      <Text style={styles.label}>Description & Details</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what help you need, time required, and any tools provided..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isLoading || loadingLocation}
      >
        {isLoading || loadingLocation ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Publish Task</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  activeCatPill: {
    backgroundColor: '#2563eb',
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  activeCatText: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

