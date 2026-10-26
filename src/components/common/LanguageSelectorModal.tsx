import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../i18n';
import { Language } from '../../i18n/translations';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { language, setLanguage, t } = useTranslation();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="globe-outline" size={20} color="#103B31" />
                  </View>
                  <View>
                    <Text style={styles.title}>
                      {language === 'am' ? 'ቋንቋ ይምረጡ' : 'Select Language'}
                    </Text>
                    <Text style={styles.subtitle}>
                      {language === 'am' ? 'Choose Language' : 'ቋንቋ ይምረጡ'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Language Options */}
              <View style={styles.optionsList}>
                {/* English Option */}
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    language === 'en' && styles.optionItemActive,
                  ]}
                  onPress={() => handleSelect('en')}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.badge,
                        language === 'en' && styles.badgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          language === 'en' && styles.badgeTextActive,
                        ]}
                      >
                        EN
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.optionTitle,
                          language === 'en' && styles.optionTitleActive,
                        ]}
                      >
                        English
                      </Text>
                      <Text style={styles.optionSub}>English</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      language === 'en' && styles.radioCircleActive,
                    ]}
                  >
                    {language === 'en' && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Amharic Option */}
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    language === 'am' && styles.optionItemActive,
                  ]}
                  onPress={() => handleSelect('am')}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.badge,
                        language === 'am' && styles.badgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          language === 'am' && styles.badgeTextActive,
                        ]}
                      >
                        አማ
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.optionTitle,
                          language === 'am' && styles.optionTitleActive,
                        ]}
                      >
                        አማርኛ
                      </Text>
                      <Text style={styles.optionSub}>Amharic</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      language === 'am' && styles.radioCircleActive,
                    ]}
                  >
                    {language === 'am' && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Close / Done Button */}
              <TouchableOpacity
                style={styles.doneButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.doneButtonText}>
                  {t('common.done') || (language === 'am' ? 'ተጠናቋል' : 'Done')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  optionItemActive: {
    borderColor: '#103B31',
    backgroundColor: '#F3FAF6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: '#103B31',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  badgeTextActive: {
    color: '#ffffff',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  optionTitleActive: {
    color: '#103B31',
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  radioCircleActive: {
    backgroundColor: '#103B31',
    borderColor: '#103B31',
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#103B31',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
