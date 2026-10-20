import React from 'react';
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

export const LandingScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        {/* Main Center Content: Logo & Text */}
        <View style={styles.centerContent}>
          {/* Brand Logo */}
          <View style={styles.logoContainer}>
            <SiraLogo width={160} />
          </View>

          {/* Explanation Text */}
          <View style={styles.textContainer}>
            <Text style={styles.headline}>
              Local tasks.{'\n'}Instant earnings.
            </Text>
            <Text style={styles.subtitle}>
              Find quick paid gigs in your neighborhood or hire trusted neighbors in minutes.
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>Continue to Sign In</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>Create an Account</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            By continuing, you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </View>
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
    paddingTop: 40,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
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
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#103B31',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#103B31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
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
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
});
