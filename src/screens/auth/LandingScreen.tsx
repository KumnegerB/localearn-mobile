import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LandingScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Logo / Brand Header */}
        <View style={styles.topHeader}>
          <View style={styles.brandIconWrapper}>
            <Ionicons name="sparkles" size={22} color="#ffffff" />
          </View>
          <Text style={styles.brandTitle}>LocalEarn</Text>
        </View>

        {/* Hero Preview Card Visual */}
        <View style={styles.heroVisualContainer}>
          {/* Main Simulated Gig Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewCardTop}>
              <View style={styles.categoryPill}>
                <Ionicons name="hammer-outline" size={13} color="#7c3aed" style={{ marginRight: 4 }} />
                <Text style={styles.categoryText}>Home & Yard</Text>
              </View>
              <Text style={styles.budgetText}>$65</Text>
            </View>

            <Text style={styles.gigTitle}>Help assembling bookshelf & desk</Text>
            
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#7c3aed" />
              <Text style={styles.locationText}>Oakridge Ave • 0.6 km away</Text>
            </View>

            <View style={styles.previewDivider} />

            <View style={styles.previewCardBottom}>
              <View style={styles.authorRow}>
                <View style={styles.mockAvatar}>
                  <Text style={styles.mockAvatarText}>S</Text>
                </View>
                <Text style={styles.authorName}>Sarah M. (★ 4.9)</Text>
              </View>
              <View style={styles.appliedPill}>
                <Ionicons name="checkmark-circle" size={13} color="#16a34a" style={{ marginRight: 3 }} />
                <Text style={styles.appliedPillText}>Apply in 1 tap</Text>
              </View>
            </View>
          </View>

          {/* Floating Feature Tags */}
          <View style={styles.floatingTagLeft}>
            <Ionicons name="navigate-circle" size={18} color="#7c3aed" />
            <Text style={styles.floatingTagText}>Live Map Search</Text>
          </View>

          <View style={styles.floatingTagRight}>
            <Ionicons name="chatbubbles" size={18} color="#2563eb" />
            <Text style={styles.floatingTagText}>Private 1-on-1 Chat</Text>
          </View>
        </View>

        {/* Punchy Text Explanation */}
        <View style={styles.textSection}>
          <Text style={styles.headline}>
            Local tasks.{'\n'}Instant earnings.
          </Text>
          <Text style={styles.subtitle}>
            Find quick gigs in your neighborhood or hire trusted neighbors in minutes with no hassle.
          </Text>
        </View>

        {/* 3 Quick Benefit Chips */}
        <View style={styles.benefitsRow}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIconBox}>
              <Ionicons name="map-outline" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.benefitTitle}>Around You</Text>
            <Text style={styles.benefitDesc}>Walkable gigs</Text>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconBox}>
              <Ionicons name="wallet-outline" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.benefitTitle}>Zero Hassle</Text>
            <Text style={styles.benefitDesc}>Direct cash/deals</Text>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.benefitTitle}>Private Chat</Text>
            <Text style={styles.benefitDesc}>Secure & direct</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
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
            <Text style={styles.secondaryButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </View>

        {/* Simple Footer Note */}
        <Text style={styles.footerNote}>
          By continuing, you agree to our Terms and Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  heroVisualContainer: {
    position: 'relative',
    marginVertical: 12,
    alignItems: 'center',
  },
  previewCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#ede9fe',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  previewCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
  },
  budgetText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  gigTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  previewCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  mockAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  appliedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  floatingTagLeft: {
    position: 'absolute',
    top: -12,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 6,
  },
  floatingTagRight: {
    position: 'absolute',
    bottom: -14,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 6,
  },
  floatingTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  textSection: {
    marginVertical: 18,
  },
  headline: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '400',
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  benefitItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  benefitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  actionGroup: {
    gap: 12,
    marginBottom: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
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
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
});
