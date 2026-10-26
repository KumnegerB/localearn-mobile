import React, { useState, useEffect, useRef } from 'react';
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
import { useTranslation } from '../../i18n';
import { SiraLogo } from '../../components/common/SiraLogo';

const RESEND_COOLDOWN = 45;

export const EmailVerificationScreen = ({ navigation, route }: any) => {
  const { user, sendOTP, verifyOTP } = useAuthStore();
  const { t } = useTranslation();

  const userEmail = route.params?.email || user?.email || '';
  const nextScreen = route.params?.nextScreen || 'RulesAndResponsibilities';

  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  const inputRef = useRef<TextInput>(null);

  // Countdown timer for resend
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 6);
    setOtpCode(cleaned);
    setErrorMessage(null);

    // Auto verify when 6 digits entered
    if (cleaned.length === 6) {
      submitVerification(cleaned);
    }
  };

  const submitVerification = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (code.length !== 6) {
      setErrorMessage(t('otp.enterCode'));
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsVerifying(true);

    const result = await verifyOTP(userEmail, code);
    setIsVerifying(false);

    if (result.success) {
      setSuccessMessage(t('otp.verifiedSuccess'));
      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        const hasUsername = Boolean(currentUser?.username);

        if (!hasUsername) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ChooseUsername', params: { isOnboarding: true } }],
          });
        } else if (nextScreen === 'RulesAndResponsibilities') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'RulesAndResponsibilities', params: { isFirstTime: true } }],
          });
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }, 900);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Register' }],
      });
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsResending(true);

    const result = await sendOTP(userEmail);
    setIsResending(false);

    if (result.success) {
      setSuccessMessage(t('otp.codeSent'));
      setCountdown(RESEND_COOLDOWN);
      setOtpCode('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setErrorMessage(result.message);
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>

            <View style={styles.brandPill}>
              <SiraLogo width={36} />
            </View>

            <View style={styles.backPlaceholder} />
          </View>

          {/* Icon Badge */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-open-outline" size={38} color="#103B31" />
            </View>
          </View>

          {/* Heading */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('otp.title')}</Text>
            <Text style={styles.subtitle}>
              {t('otp.subtitle')}
            </Text>
            <Text style={styles.emailHighlight}>{userEmail}</Text>
          </View>

          {/* Error / Success Feedback */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={17} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={17} color="#15803d" style={{ marginRight: 6 }} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* 6 Digit PIN Cells */}
          <TouchableOpacity
            style={styles.codeWrapper}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            <View style={styles.codeContainer}>
              {Array.from({ length: 6 }).map((_, index) => {
                const char = otpCode[index] || '';
                const isFocused = otpCode.length === index;

                return (
                  <View
                    key={index}
                    style={[
                      styles.codeCell,
                      char ? styles.codeCellFilled : null,
                      isFocused ? styles.codeCellActive : null,
                    ]}
                  >
                    <Text style={styles.codeCellText}>{char}</Text>
                  </View>
                );
              })}
            </View>

            {/* Hidden Input Layer */}
            <TextInput
              ref={inputRef}
              value={otpCode}
              onChangeText={handleOtpChange}
              maxLength={6}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              style={styles.hiddenInput}
              autoFocus
            />
          </TouchableOpacity>

          {/* Action Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              otpCode.length !== 6 && styles.verifyButtonDisabled,
            ]}
            onPress={() => submitVerification()}
            disabled={isVerifying || otpCode.length !== 6}
            activeOpacity={0.85}
          >
            {isVerifying ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.verifyButtonText}>{t('otp.verifyBtn')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={styles.resendSection}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                {t('otp.resendIn', { seconds: countdown })}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={isResending}
                activeOpacity={0.7}
                style={styles.resendBtn}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color="#103B31" />
                ) : (
                  <Text style={styles.resendBtnText}>{t('otp.resendCode')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Back link */}
          <TouchableOpacity
            style={styles.changeEmailBtn}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.changeEmailText}>{t('otp.changeEmail')}</Text>
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
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backPlaceholder: {
    width: 40,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: '#EBF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CDE4D7',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.6,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  emailHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#103B31',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
  },
  codeWrapper: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  codeCell: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCellActive: {
    borderColor: '#103B31',
    backgroundColor: '#F3FAF6',
  },
  codeCellFilled: {
    borderColor: '#103B31',
    backgroundColor: '#ffffff',
  },
  codeCellText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#103B31',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0.01,
    width: 1,
    height: 1,
  },
  verifyButton: {
    flexDirection: 'row',
    width: '100%',
    height: 52,
    backgroundColor: '#103B31',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#103B31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    fontSize: 14,
    color: '#103B31',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  changeEmailBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeEmailText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
