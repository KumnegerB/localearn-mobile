import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SiraLogo } from '../../components/common/SiraLogo';

interface RuleItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  badgeBg: string;
  title: string;
  description: string;
}

const RULES: RuleItem[] = [
  {
    id: 'payment',
    icon: 'wallet-outline',
    iconColor: '#103B31',
    badgeBg: '#e8f3ef',
    title: 'Payment Responsibility',
    description:
      'ስራ is only a platform that connects people. We are not responsible if someone doesn’t pay you. Always agree on payment clearly before starting any task.',
  },
  {
    id: 'report',
    icon: 'alert-circle-outline',
    iconColor: '#dc2626',
    badgeBg: '#fee2e2',
    title: 'Report Bad Behavior',
    description:
      'If someone doesn’t pay, behaves badly, or breaks the rules, please report them immediately. We will review and ban users who violate the rules.',
  },
  {
    id: 'respect',
    icon: 'heart-outline',
    iconColor: '#103B31',
    badgeBg: '#e8f3ef',
    title: 'Be Honest & Respectful',
    description:
      'Always communicate clearly and treat others with respect.',
  },
  {
    id: 'illegal',
    icon: 'ban-outline',
    iconColor: '#ea580c',
    badgeBg: '#ffedd5',
    title: 'No Illegal Tasks',
    description:
      'Do not post or accept any illegal, dangerous, or harmful tasks.',
  },
  {
    id: 'completion',
    icon: 'checkmark-done-circle-outline',
    iconColor: '#103B31',
    badgeBg: '#e8f3ef',
    title: 'Complete What You Agree',
    description:
      'If you accept a task, try your best to complete it as agreed.',
  },
  {
    id: 'safety',
    icon: 'shield-checkmark-outline',
    iconColor: '#2563eb',
    badgeBg: '#dbeafe',
    title: 'Stay Safe',
    description:
      'Meet in public places when possible and trust your instincts.',
  },
];

export const RulesAndResponsibilitiesScreen = ({ navigation, route }: any) => {
  const isFirstTime = route.params?.isFirstTime ?? false;

  const handleAgreeAndContinue = async () => {
    try {
      await AsyncStorage.setItem('@localearn_rules_accepted', 'true');
    } catch {
      // Ignored
    }

    if (isFirstTime) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        {!isFirstTime ? (
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

        <View style={styles.logoPill}>
          <SiraLogo width={28} />
          <Text style={styles.logoPillText}>ስራ</Text>
        </View>

        <View style={styles.backPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Introduction Banner */}
        <View style={styles.heroSection}>
          <View style={styles.shieldIconContainer}>
            <Ionicons name="shield-checkmark" size={32} color="#103B31" />
          </View>
          <Text style={styles.mainTitle}>Rules & Responsibilities</Text>
          <Text style={styles.welcomeSubtitle}>Welcome to ስራ!</Text>
          <Text style={styles.leadText}>
            Before you start, please read these important rules designed to keep our neighborhood community safe, fair, and trustworthy.
          </Text>
        </View>

        {/* Rules Cards List */}
        <View style={styles.rulesList}>
          {RULES.map((rule, index) => (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBadge, { backgroundColor: rule.badgeBg }]}>
                  <Ionicons name={rule.icon} size={20} color={rule.iconColor} />
                </View>
                <View style={styles.ruleNumberBadge}>
                  <Text style={styles.ruleNumberText}>Rule #{index + 1}</Text>
                </View>
              </View>

              <Text style={styles.ruleTitle}>{rule.title}</Text>
              <Text style={styles.ruleDescription}>{rule.description}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Acknowledgment Notice */}
        <View style={styles.agreementNotice}>
          <Ionicons name="information-circle-outline" size={18} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.agreementNoticeText}>
            By continuing, you agree to follow these rules and uphold our community standards.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Sticky Action Bar at Bottom */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarSafeArea}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleAgreeAndContinue}
          >
            <Text style={styles.primaryButtonText}>
              {isFirstTime ? 'Agree & Continue' : 'I Understand'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  logoPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#103B31',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#e8f3ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#c6e3d9',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#103B31',
    marginBottom: 10,
    textAlign: 'center',
  },
  leadText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  rulesList: {
    gap: 14,
  },
  ruleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumberBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ruleNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  ruleDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '400',
  },
  agreementNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  agreementNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '500',
  },
  bottomBarSafeArea: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
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
});

