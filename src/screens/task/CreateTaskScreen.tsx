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
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTaskStore } from '../../store/useTaskStore';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import {
  validateTaskTitle,
  validateTaskDescription,
  validateBudget,
} from '../../utils/validators';
import { useRequireTrustAction } from '../../hooks/useRequireTrustAction';
import { TrustActionModal } from '../../components/trust/TrustActionModal';
import { useTranslation } from '../../i18n';

const CATEGORIES = ['Home & Yard', 'Moving', 'Delivery', 'Pet Care', 'Tech Help', 'General'];

interface TaskFormErrors {
  title?: string;
  budget?: string;
  description?: string;
  location?: string;
}

export const CreateTaskScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [errors, setErrors] = useState<TaskFormErrors>({});

  const { createTask, isLoading } = useTaskStore();

  const {
    modalMode,
    actionTitle,
    requireTrustAction,
    closeModal,
    handleVerificationSuccess,
  } = useRequireTrustAction();

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

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  const handleBudgetChange = (val: string) => {
    setBudget(val);
    if (errors.budget) {
      setErrors((prev) => ({ ...prev, budget: undefined }));
    }
  };

  const handleLocationChange = (val: string) => {
    setLocationName(val);
    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: undefined }));
    }
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const doPublishTask = async () => {
    setErrors({});
    const numBudget = parseFloat(budget.trim());

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
      Alert.alert('Task Posted! 🎉', 'Your task is now visible to nearby neighbors.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      const currentError = useTaskStore.getState().error;
      Alert.alert('Unable to Post Task', currentError || 'Failed to post task. Please verify your details.');
    }
  };

  const handleSubmit = async () => {
    const titleErr = validateTaskTitle(title);
    const budgetErr = validateBudget(budget);
    const descErr = validateTaskDescription(description);
    const locationErr = !locationName.trim() ? 'Please provide a neighborhood or address area.' : null;

    if (titleErr || budgetErr || descErr || locationErr) {
      setErrors({
        title: titleErr || undefined,
        budget: budgetErr || undefined,
        description: descErr || undefined,
        location: locationErr || undefined,
      });
      return;
    }

    requireTrustAction(() => {
      doPublishTask();
    }, 'publish a task');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Task Title */}
      <Text style={styles.label}>{t('createTask.gigTitle')}</Text>
      <TextInput
        style={[styles.input, !!errors.title && styles.inputError]}
        placeholder={t('createTask.gigTitlePlaceholder')}
        placeholderTextColor="#94a3b8"
        value={title}
        onChangeText={handleTitleChange}
        cursorColor="#103B31"
        selectionColor="#d1e3dd"
      />
      {errors.title ? (
        <View style={styles.inlineErrorRow}>
          <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
          <Text style={styles.inlineErrorText}>{errors.title}</Text>
        </View>
      ) : null}

      {/* Category */}
      <Text style={styles.label}>{t('createTask.category')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catPill, category === cat && styles.activeCatPill]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.catText, category === cat && styles.activeCatText]}>
              {t(`categories.${cat}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Currency */}
      <Text style={styles.label}>Select Currency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {SUPPORTED_CURRENCIES.map((curr) => (
          <TouchableOpacity
            key={curr.code}
            style={[styles.catPill, currency === curr.code && styles.activeCatPill]}
            onPress={() => setCurrency(curr.code)}
            activeOpacity={0.7}
          >
            <Text style={[styles.catText, currency === curr.code && styles.activeCatText]}>
              {curr.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Budget */}
      <Text style={styles.label}>{t('createTask.budget')}</Text>
      <TextInput
        style={[styles.input, !!errors.budget && styles.inputError]}
        placeholder={t('createTask.budgetPlaceholder')}
        placeholderTextColor="#94a3b8"
        value={budget}
        onChangeText={handleBudgetChange}
        keyboardType="numeric"
        cursorColor="#103B31"
        selectionColor="#d1e3dd"
      />
      {errors.budget ? (
        <View style={styles.inlineErrorRow}>
          <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
          <Text style={styles.inlineErrorText}>{errors.budget}</Text>
        </View>
      ) : null}

      {/* Location */}
      <Text style={styles.label}>{t('createTask.location')}</Text>
      <TextInput
        style={[styles.input, !!errors.location && styles.inputError]}
        placeholder={t('createTask.locationPlaceholder')}
        placeholderTextColor="#94a3b8"
        value={locationName}
        onChangeText={handleLocationChange}
        cursorColor="#103B31"
        selectionColor="#d1e3dd"
      />
      {errors.location ? (
        <View style={styles.inlineErrorRow}>
          <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
          <Text style={styles.inlineErrorText}>{errors.location}</Text>
        </View>
      ) : null}

      {/* Description */}
      <Text style={styles.label}>{t('createTask.description')}</Text>
      <TextInput
        style={[styles.input, styles.textArea, !!errors.description && styles.inputError]}
        placeholder={t('createTask.descPlaceholder')}
        placeholderTextColor="#94a3b8"
        value={description}
        onChangeText={handleDescriptionChange}
        multiline
        numberOfLines={4}
        cursorColor="#103B31"
        selectionColor="#d1e3dd"
      />
      {errors.description ? (
        <View style={styles.inlineErrorRow}>
          <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
          <Text style={styles.inlineErrorText}>{errors.description}</Text>
        </View>
      ) : null}

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isLoading || loadingLocation}
        activeOpacity={0.85}
      >
        {isLoading || loadingLocation ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{t('createTask.publishBtn')}</Text>
        )}
      </TouchableOpacity>

      <TrustActionModal
        mode={modalMode}
        actionTitle={actionTitle}
        onClose={closeModal}
        onVerificationSuccess={handleVerificationSuccess}
        navigation={navigation}
      />
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
    marginTop: 14,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  inlineErrorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  activeCatPill: {
    backgroundColor: '#103B31',
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
    backgroundColor: '#103B31',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#103B31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
