import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import {
  validateFullName,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
} from '../../utils/validators';
import { SiraLogo } from '../../components/common/SiraLogo';

interface RegisterErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
}

export const RegisterScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const { register, isLoading, error } = useAuthStore();

  useEffect(() => {
    useAuthStore.setState({ error: null });
  }, []);

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (errors.fullName) {
      setErrors((prev) => ({ ...prev, fullName: undefined }));
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (errors.phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleRegister = async () => {
    const nameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const phoneErr = validatePhoneNumber(phoneNumber);
    const passErr = validatePassword(password, 6);

    if (nameErr || emailErr || phoneErr || passErr) {
      setErrors({
        fullName: nameErr || undefined,
        email: emailErr || undefined,
        phoneNumber: phoneErr || undefined,
        password: passErr || undefined,
      });
      return;
    }

    setErrors({});
    const success = await register(fullName.trim(), email.trim(), password, phoneNumber.trim() || undefined);
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'RulesAndResponsibilities', params: { isFirstTime: true } }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Landing');
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#1e293b" />
            </TouchableOpacity>

            <View style={styles.brandPill}>
              <SiraLogo width={30} />
              <Text style={styles.brandPillText}>ስራ</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={styles.header}>
            <Text style={styles.title}>Join ስራ 🚀</Text>
            <Text style={styles.subtitle}>
              Create your account to start picking up neighbourhood gigs or posting tasks.
            </Text>
          </View>

          {/* Backend Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[styles.inputBox, !!errors.fullName && styles.inputBoxError]}>
              <Ionicons
                name="person-outline"
                size={20}
                color={errors.fullName ? '#ef4444' : '#103B31'}
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Alex Johnson"
                placeholderTextColor="#94a3b8"
                value={fullName}
                onChangeText={handleFullNameChange}
                autoCorrect={false}
                cursorColor="#103B31"
                selectionColor="#d1e3dd"
              />
            </View>
            {errors.fullName ? (
              <View style={styles.inlineErrorRow}>
                <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={styles.inlineErrorText}>{errors.fullName}</Text>
              </View>
            ) : null}

            {/* Email Address */}
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputBox, !!errors.email && styles.inputBoxError]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={errors.email ? '#ef4444' : '#103B31'}
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor="#103B31"
                selectionColor="#d1e3dd"
              />
            </View>
            {errors.email ? (
              <View style={styles.inlineErrorRow}>
                <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={styles.inlineErrorText}>{errors.email}</Text>
              </View>
            ) : null}

            {/* Phone Number (Optional) */}
            <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
            <View style={[styles.inputBox, !!errors.phoneNumber && styles.inputBoxError]}>
              <Ionicons
                name="call-outline"
                size={20}
                color={errors.phoneNumber ? '#ef4444' : '#103B31'}
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="+1 555-0199"
                placeholderTextColor="#94a3b8"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoCorrect={false}
                cursorColor="#103B31"
                selectionColor="#d1e3dd"
              />
            </View>
            {errors.phoneNumber ? (
              <View style={styles.inlineErrorRow}>
                <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={styles.inlineErrorText}>{errors.phoneNumber}</Text>
              </View>
            ) : null}

            {/* Password */}
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputBox, !!errors.password && styles.inputBoxError]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={errors.password ? '#ef4444' : '#103B31'}
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Create a password (min 6 chars)"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor="#103B31"
                selectionColor="#d1e3dd"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <View style={styles.inlineErrorRow}>
                <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={styles.inlineErrorText}>{errors.password}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Switcher */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1e3dd',
  },
  brandPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#103B31',
    marginLeft: 6,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
  },
  inputBoxError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  inlineErrorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    height: '100%',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#103B31',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#103B31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  signInLink: {
    color: '#FF6B3D',
    fontSize: 14,
    fontWeight: '800',
  },
});
