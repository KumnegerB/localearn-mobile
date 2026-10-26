import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { language, setLanguage } = useTranslation();

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
          <SafeAreaView edges={['top', 'right']} style={styles.safeArea}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownContainer}>
                {/* Header with Title and 'X' in top right to close */}
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>
                    {language === 'am' ? 'ቋንቋ' : 'Language'}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={17} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Option 1: English */}
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    language === 'en' && styles.optionRowActive,
                  ]}
                  onPress={() => handleSelect('en')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      language === 'en' && styles.optionTextActive,
                    ]}
                  >
                    English
                  </Text>
                  {language === 'en' && (
                    <Ionicons name="checkmark" size={18} color="#103B31" />
                  )}
                </TouchableOpacity>

                {/* Option 2: አማርኛ */}
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    language === 'am' && styles.optionRowActive,
                  ]}
                  onPress={() => handleSelect('am')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      language === 'am' && styles.optionTextActive,
                    ]}
                  >
                    አማርኛ
                  </Text>
                  {language === 'am' && (
                    <Ionicons name="checkmark" size={18} color="#103B31" />
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  safeArea: {
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  dropdownContainer: {
    width: 175,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: Platform.OS === 'ios' ? 44 : 52,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  optionRowActive: {
    backgroundColor: '#F3FAF6',
  },
  optionText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#103B31',
    fontWeight: '700',
  },
});
