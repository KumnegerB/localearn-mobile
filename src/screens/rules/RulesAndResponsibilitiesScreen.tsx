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
import { useTranslation } from '../../i18n';

interface RuleItem {
  id: string;
  titleKey: string;
  descKey: string;
}

const RULE_CONFIGS: RuleItem[] = [
  {
    id: 'payment',
    titleKey: 'rules.rule1Title',
    descKey: 'rules.rule1Desc',
  },
  {
    id: 'report',
    titleKey: 'rules.rule2Title',
    descKey: 'rules.rule2Desc',
  },
  {
    id: 'respect',
    titleKey: 'rules.rule3Title',
    descKey: 'rules.rule3Desc',
  },
  {
    id: 'illegal',
    titleKey: 'rules.rule4Title',
    descKey: 'rules.rule4Desc',
  },
  {
    id: 'completion',
    titleKey: 'rules.rule5Title',
    descKey: 'rules.rule5Desc',
  },
  {
    id: 'safety',
    titleKey: 'rules.rule6Title',
    descKey: 'rules.rule6Desc',
  },
];

export const RulesAndResponsibilitiesScreen = ({ navigation, route }: any) => {
  const isFirstTime = route.params?.isFirstTime ?? false;
  const { t, language } = useTranslation();

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
          <SiraLogo width={36} />
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
          <Text style={styles.mainTitle}>{t('rules.title')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('rules.welcome')}</Text>
          <Text style={styles.leadText}>
            {t('rules.lead')}
          </Text>
        </View>

        {/* Rules Cards List */}
        <View style={styles.rulesList}>
          {RULE_CONFIGS.map((rule, index) => (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={styles.cardHeader}>
                <View style={styles.ruleNumberBadge}>
                  <Text style={styles.ruleNumberText}>
                    {language === 'am' ? 'ደንብ' : 'Rule'} #{index + 1}
                  </Text>
                </View>
              </View>

              <Text style={styles.ruleTitle}>{t(rule.titleKey)}</Text>
              <Text style={styles.ruleDescription}>{t(rule.descKey)}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Acknowledgment Notice */}
        <View style={styles.agreementNotice}>
          <Text style={styles.agreementNoticeText}>
            {t('rules.notice')}
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
              {isFirstTime ? t('rules.agreeContinue') : t('rules.understand')}
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
    paddingTop: 10,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleNumberBadge: {
    backgroundColor: '#e8f3ef',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ruleNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#103B31',
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

