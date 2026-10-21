import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { TrustModalMode } from '../../hooks/useRequireTrustAction';

interface TrustActionModalProps {
  mode: TrustModalMode;
  actionTitle?: string;
  onClose: () => void;
  onVerificationSuccess: () => void;
  navigation: any;
}

export const TrustActionModal: React.FC<TrustActionModalProps> = ({
  mode,
  actionTitle = 'continue',
  onClose,
  onVerificationSuccess,
  navigation,
}) => {
  const { user, verifyAccount } = useAuthStore();
  const [telegramUsername, setTelegramUsername] = useState(user?.telegram_username || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!mode) return null;

  const handleVerifySubmit = async () => {
    setErrorMessage(null);
    const tg = telegramUsername.trim();
    const phone = phoneNumber.trim();

    if (!tg && !phone) {
      setErrorMessage('Please enter either a Telegram handle or phone number.');
      return;
    }

    setIsSubmitting(true);
    const success = await verifyAccount(tg || undefined, phone || undefined);
    setIsSubmitting(false);

    if (success) {
      onVerificationSuccess();
    } else {
      setErrorMessage('Could not verify account. Please check your network and try again.');
    }
  };

  return (
    <Modal visible={Boolean(mode)} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Close Handle */}
          <View style={styles.sheetHandle} />

          {mode === 'auth' ? (
            /* Mode 1: Authentication Gate */
            <View style={styles.content}>
              <View style={[styles.iconCircle, { backgroundColor: '#f2f7f5' }]}>
                <Ionicons name="lock-closed-outline" size={32} color="#103B31" />
              </View>

              <Text style={styles.title}>Sign In Required</Text>
              <Text style={styles.subtitle}>
                You need an account to {actionTitle}. Sign in or create a free profile in seconds to connect with your local community.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  navigation.navigate('Login');
                }}
              >
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  navigation.navigate('Register');
                }}
              >
                <Text style={styles.secondaryButtonText}>Create New Account</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Mode 2: Trust & Verification Gate */
            <View style={styles.content}>
              <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="shield-checkmark-outline" size={32} color="#2563eb" />
              </View>

              <Text style={styles.title}>Verify Account to Continue</Text>
              <Text style={styles.subtitle}>
                To keep our neighborhood safe and ensure task coordination is reliable, please link your Telegram username or phone number before your action goes live.
              </Text>

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Telegram Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telegram Username</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="paper-plane-outline" size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="@your_username"
                    placeholderTextColor="#94a3b8"
                    value={telegramUsername}
                    onChangeText={setTelegramUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Phone Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+251 9... or +1..."
                    placeholderTextColor="#94a3b8"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                activeOpacity={0.85}
                onPress={handleVerifySubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Proceed</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
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
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#103B31',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#f2f7f5',
    borderWidth: 1,
    borderColor: '#cce3de',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#103B31',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
});
