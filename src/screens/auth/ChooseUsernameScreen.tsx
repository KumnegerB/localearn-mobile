import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../i18n';
import { SiraLogo } from '../../components/common/SiraLogo';
import { validateUsername } from '../../utils/validators';

interface ChooseUsernameScreenProps {
  navigation: any;
  route?: {
    params?: {
      isOnboarding?: boolean;
    };
  };
}

type CheckStatus = 'idle' | 'checking' | 'available' | 'unavailable';

export const ChooseUsernameScreen: React.FC<ChooseUsernameScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const isOnboarding = route?.params?.isOnboarding ?? false;

  const user = useAuthStore((s) => s.user);
  const setUsername = useAuthStore((s) => s.setUsername);
  const checkUsernameAvailability = useAuthStore((s) => s.checkUsernameAvailability);

  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time check on input change
  const handleChangeText = (text: string) => {
    // Strip spaces and force lowercase
    const cleaned = text.replace(/\s+/g, '').toLowerCase();
    setUsernameInput(cleaned);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!cleaned) {
      setStatus('idle');
      setStatusMessage(null);
      return;
    }

    // Client-side quick check
    const formatCheck = validateUsername(cleaned);
    if (!formatCheck.isValid) {
      setStatus('unavailable');
      setStatusMessage(formatCheck.error);
      return;
    }

    // If matches user's current username, it's valid
    if (user?.username && cleaned === user.username.toLowerCase()) {
      setStatus('available');
      setStatusMessage(t('username.available'));
      return;
    }

    // Debounced API check
    setStatus('checking');
    setStatusMessage(t('username.checking'));

    debounceTimerRef.current = setTimeout(async () => {
      const res = await checkUsernameAvailability(cleaned);
      if (res.available) {
        setStatus('available');
        setStatusMessage(t('username.available'));
      } else {
        setStatus('unavailable');
        setStatusMessage(res.reason || t('username.taken'));
      }
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    const formatCheck = validateUsername(usernameInput);
    if (!formatCheck.isValid) {
      Alert.alert('Invalid Username', formatCheck.error || 'Please choose a valid username.');
      return;
    }

    setIsSubmitting(true);
    const result = await setUsername(formatCheck.normalized);
    setIsSubmitting(false);

    if (result.success) {
      if (isOnboarding) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'RulesAndResponsibilities', params: { isFirstTime: true } }],
        });
      } else {
        Alert.alert('Success', t('username.successToast'));
        navigation.goBack();
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleSkip = () => {
    if (isOnboarding) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'RulesAndResponsibilities', params: { isFirstTime: true } }],
      });
    } else {
      navigation.goBack();
    }
  };

  // Rule checklist indicators
  const lenValid = usernameInput.length >= 3 && usernameInput.length <= 20;
  const charsValid = /^[a-zA-Z0-9_]*$/.test(usernameInput) && usernameInput.length > 0;
  const edgeValid = usernameInput.length > 0 && !usernameInput.startsWith('_') && !usernameInput.endsWith('_');
  const consecValid = usernameInput.length > 0 && !usernameInput.includes('__');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            {navigation.canGoBack() && !isOnboarding ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color="#0f172a" />
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}

            <View style={styles.brandPill}>
              <SiraLogo width={36} />
            </View>

            {isOnboarding ? (
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
          </View>

          {/* Icon Badge */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="at-outline" size={38} color="#103B31" />
            </View>
          </View>

          {/* Heading */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('username.chooseTitle')}</Text>
            <Text style={styles.subtitle}>{t('username.chooseSubtitle')}</Text>
          </View>

          {/* Input Box with @ Prefix */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>{t('username.inputLabel')}</Text>
            <View
              style={[
                styles.inputWrapper,
                status === 'available' && styles.inputWrapperAvailable,
                status === 'unavailable' && styles.inputWrapperUnavailable,
              ]}
            >
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('username.placeholder')}
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                value={usernameInput}
                onChangeText={handleChangeText}
                maxLength={20}
              />
              <View style={styles.inputEndIcon}>
                {status === 'checking' && (
                  <ActivityIndicator size="small" color="#103B31" />
                )}
                {status === 'available' && (
                  <Ionicons name="checkmark-circle" size={22} color="#059669" />
                )}
                {status === 'unavailable' && (
                  <Ionicons name="close-circle" size={22} color="#dc2626" />
                )}
              </View>
            </View>

            {/* Status Message Banner */}
            {statusMessage && (
              <View
                style={[
                  styles.statusBanner,
                  status === 'available' && styles.statusBannerAvailable,
                  status === 'unavailable' && styles.statusBannerUnavailable,
                ]}
              >
                <Ionicons
                  name={
                    status === 'available'
                      ? 'checkmark-circle-outline'
                      : status === 'unavailable'
                      ? 'alert-circle-outline'
                      : 'time-outline'
                  }
                  size={16}
                  color={
                    status === 'available'
                      ? '#059669'
                      : status === 'unavailable'
                      ? '#dc2626'
                      : '#64748b'
                  }
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.statusBannerText,
                    status === 'available' && styles.statusBannerTextAvailable,
                    status === 'unavailable' && styles.statusBannerTextUnavailable,
                  ]}
                >
                  {statusMessage}
                </Text>
              </View>
            )}
          </View>

          {/* Guidelines Box */}
          <View style={styles.rulesCard}>
            <Text style={styles.rulesHeader}>{t('username.rulesTitle')}</Text>

            <View style={styles.ruleItem}>
              <Ionicons
                name={lenValid ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={lenValid ? '#059669' : '#94a3b8'}
                style={styles.ruleIcon}
              />
              <Text style={[styles.ruleText, lenValid && styles.ruleTextValid]}>
                {t('username.rule1')}
              </Text>
            </View>

            <View style={styles.ruleItem}>
              <Ionicons
                name={charsValid ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={charsValid ? '#059669' : '#94a3b8'}
                style={styles.ruleIcon}
              />
              <Text style={[styles.ruleText, charsValid && styles.ruleTextValid]}>
                {t('username.rule2')}
              </Text>
            </View>

            <View style={styles.ruleItem}>
              <Ionicons
                name={edgeValid ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={edgeValid ? '#059669' : '#94a3b8'}
                style={styles.ruleIcon}
              />
              <Text style={[styles.ruleText, edgeValid && styles.ruleTextValid]}>
                {t('username.rule3')}
              </Text>
            </View>

            <View style={styles.ruleItem}>
              <Ionicons
                name={consecValid ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={consecValid ? '#059669' : '#94a3b8'}
                style={styles.ruleIcon}
              />
              <Text style={[styles.ruleText, consecValid && styles.ruleTextValid]}>
                {t('username.rule4')}
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (status !== 'available' || isSubmitting) && styles.primaryButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={status !== 'available' || isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t('username.saveBtn')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  brandPill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f3ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  inputCard: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
  },
  inputWrapperAvailable: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  inputWrapperUnavailable: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  atSymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#103B31',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 0,
  },
  inputEndIcon: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  statusBannerAvailable: {
    backgroundColor: '#ecfdf5',
  },
  statusBannerUnavailable: {
    backgroundColor: '#fef2f2',
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  statusBannerTextAvailable: {
    color: '#059669',
  },
  statusBannerTextUnavailable: {
    color: '#dc2626',
  },
  rulesCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 32,
  },
  rulesHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleIcon: {
    marginRight: 8,
  },
  ruleText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  ruleTextValid: {
    color: '#0f172a',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#103B31',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#103B31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
