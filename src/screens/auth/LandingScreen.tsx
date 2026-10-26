import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SiraLogo } from '../../components/common/SiraLogo';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../i18n';
import { LanguageSelectorModal } from '../../components/common/LanguageSelectorModal';

export const LandingScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  const [langModalVisible, setLangModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      navigation.replace('Main');
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        {/* Top bar with Language Selector */}
        <View style={styles.topBar}>
          <View />
          <TouchableOpacity
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.7}
            style={{ padding: 6 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="globe-outline" size={24} color="#103B31" />
          </TouchableOpacity>
        </View>

        {/* Main Center Content: Logo & Text */}
        <View style={styles.centerContent}>
          {/* Brand Logo */}
          <View style={styles.logoContainer}>
            <SiraLogo width={160} />
          </View>

          {/* Explanation Text */}
          <View style={styles.textContainer}>
            <Text style={styles.headline}>
              {t('landing.headline')}
            </Text>
            <Text style={styles.subtitle}>
              {t('landing.subtitle')}
            </Text>
          </View>
        </View>

        {/* Bottom Actions: Sign In, Register, and Continue as Guest */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>{t('landing.signIn')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>{t('landing.createAccount')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            activeOpacity={0.7}
            onPress={() => navigation.replace('Main')}
          >
            <Text style={styles.guestButtonText}>{t('landing.continueGuest')}</Text>
            <Ionicons name="arrow-forward" size={15} color="#64748b" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <Text style={styles.footerText}>
            {t('landing.termsFooter')}
          </Text>
        </View>
      </View>

      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3FAF6',
    borderWidth: 1,
    borderColor: '#CDE4D7',
    borderRadius: 20,
  },
  langButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#103B31',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  textContainer: {
    marginTop: 8,
  },
  headline: {
    fontSize: 38,
    fontWeight: '900',
    color: '#103B31',
    letterSpacing: -1.2,
    lineHeight: 46,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 25,
    fontWeight: '400',
    maxWidth: '92%',
  },
  bottomSection: {
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#103B31',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#103B31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    height: 52,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#103B31',
    fontSize: 15,
    fontWeight: '700',
  },
  guestButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  guestButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
});
