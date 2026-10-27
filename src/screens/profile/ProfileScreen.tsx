import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { validateFullName, validateUsername } from '../../utils/validators';
import { useRequireTrustAction } from '../../hooks/useRequireTrustAction';
import { TrustActionModal } from '../../components/trust/TrustActionModal';
import { useTranslation } from '../../i18n';
import { resetToLanding } from '../../navigation/navigationRef';

const MAX_BIO_LENGTH = 160;

const PRESET_SKILLS = [
  'Plumbing',
  'Electrical',
  'Home Cleaning',
  'Moving & Lifting',
  'Carpentry',
  'Painting',
  'Gardening & Yard',
  'Tech Support',
  'Delivery & Errands',
  'Pet Care',
  'Tutoring',
  'Cooking & Catering',
  'Tailoring',
  'Auto Repair',
  'Furniture Assembly',
  'Handyman',
];

const SUPPORT_EMAIL = 'kb.productions.work@gmail.com';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, updateProfile } = useAuthStore();
  const { t, language } = useTranslation();
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const handleSendEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('ስራ Support / Feedback')}`);
  };

  const {
    modalMode,
    actionTitle,
    requireTrustAction,
    closeModal,
    handleVerificationSuccess,
  } = useRequireTrustAction();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const skillsList = (user?.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleOpenEdit = () => {
    setFullName(user?.full_name || '');
    setUsername(user?.username || '');
    setBio(user?.bio || '');
    const currentSkills = (user?.skills || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setSelectedSkills(currentSkills);
    setCustomSkillInput('');
    setNameError(null);
    setUsernameError(null);
    setIsEditing(true);
  };

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (nameError) setNameError(null);
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (!selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setCustomSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async () => {
    const err = validateFullName(fullName);
    if (err) {
      setNameError(err);
      return;
    }
    setNameError(null);

    let cleanUsername: string | undefined = undefined;
    if (username.trim()) {
      const userCheck = validateUsername(username);
      if (!userCheck.isValid) {
        setUsernameError(userCheck.error);
        return;
      }
      cleanUsername = userCheck.normalized;
    }
    setUsernameError(null);

    setIsSaving(true);
    const success = await updateProfile({
      full_name: fullName.trim(),
      username: cleanUsername,
      bio: bio.trim(),
      skills: selectedSkills.join(', '),
    });
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved.');
    } else {
      const storeErr = useAuthStore.getState().error;
      Alert.alert('Error', storeErr || 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          resetToLanding();
        },
      },
    ]);
  };

  const formatJoinDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconBox}>
            <Ionicons name="person-circle-outline" size={68} color="#103B31" />
          </View>
          <Text style={styles.guestTitle}>{t('profile.welcomeTitle')}</Text>
          <Text style={styles.guestSubtitle}>
            {t('profile.welcomeSub')}
          </Text>
          <TouchableOpacity
            style={styles.guestSignInBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.guestSignInBtnText}>{t('profile.signInRegister')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestRulesBtn}
            onPress={() => navigation.navigate('RulesAndResponsibilities', { isFirstTime: false })}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color="#103B31" style={{ marginRight: 6 }} />
            <Text style={styles.guestRulesBtnText}>{t('profile.rulesTitle')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isVerified = Boolean(user.is_verified || user.telegram_username);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Hero Card with Pen in Top Right */}
      <View style={styles.headerCard}>
        <TouchableOpacity
          style={styles.editPenBtn}
          onPress={handleOpenEdit}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil" size={17} color="#103B31" />
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text>
        </View>

        <Text style={styles.name}>{user?.full_name}</Text>

        {user?.username ? (
          <Text style={styles.usernameHandle}>@{user.username}</Text>
        ) : (
          <TouchableOpacity
            style={styles.setUsernamePrompt}
            onPress={handleOpenEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="at" size={13} color="#103B31" style={{ marginRight: 2 }} />
            <Text style={styles.setUsernamePromptText}>
              {language === 'am' ? 'የተጠቃሚ ስም ይምረጡ' : 'Choose @username'}
            </Text>
          </TouchableOpacity>
        )}

        {user?.rating_count && user.rating_count > 0 ? (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>
              ★ {user.rating.toFixed(1)} ({user.rating_count} reviews)
            </Text>
          </View>
        ) : null}

        {/* About Me directly under the name & rating */}
        <Text style={styles.bioText} numberOfLines={3}>
          {user?.bio && user.bio.trim()
            ? user.bio.slice(0, MAX_BIO_LENGTH)
            : 'No bio added yet. Tap the pen to add a short intro!'}
        </Text>

        {/* Skills Tags directly under description */}
        <View style={styles.skillsTagsWrapper}>
          {skillsList.length > 0 ? (
            skillsList.map((skill, index) => (
              <View key={index} style={styles.skillTagBadge}>
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            ))
          ) : (
            <TouchableOpacity
              style={styles.addSkillsPrompt}
              onPress={handleOpenEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={14} color="#103B31" style={{ marginRight: 4 }} />
              <Text style={styles.addSkillsPromptText}>Add your skills</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* My Gigs Management Section */}
      <TouchableOpacity
        style={styles.myGigsCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('MyJobs')}
      >
        <View style={styles.myGigsLeft}>
          <View style={styles.myGigsIconWrapper}>
            <Ionicons name="briefcase" size={22} color="#FF6B3D" />
          </View>
          <View>
            <Text style={styles.myGigsTitle}>{t('profile.myGigsTitle')}</Text>
            <Text style={styles.myGigsSubtitle}>{t('profile.myGigsSub')}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>

      {/* Account Info Card */}
      <View style={styles.accountCard}>
        <Text style={styles.accountCardTitle}>{t('profile.accountInfo')}</Text>

        <View style={styles.accountRow}>
          <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.accountIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.accountLabel}>{t('auth.email')}</Text>
            <Text style={styles.accountValue}>{user?.email || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.accountDivider} />

        <View style={styles.accountRow}>
          <Ionicons name="calendar-outline" size={18} color="#64748b" style={styles.accountIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.accountLabel}>{t('profile.memberSince')}</Text>
            <Text style={styles.accountValue}>{formatJoinDate(user?.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Rules & Responsibilities Card */}
      <TouchableOpacity
        style={styles.myGigsCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('RulesAndResponsibilities', { isFirstTime: false })}
      >
        <View style={styles.myGigsLeft}>
          <View style={[styles.myGigsIconWrapper, { backgroundColor: '#e8f3ef' }]}>
            <Ionicons name="shield-checkmark" size={22} color="#103B31" />
          </View>
          <View>
            <Text style={styles.myGigsTitle}>{t('profile.rulesTitle')}</Text>
            <Text style={styles.myGigsSubtitle}>{t('profile.rulesSub')}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>

      {/* Contact Us Card */}
      <TouchableOpacity
        style={styles.myGigsCard}
        activeOpacity={0.8}
        onPress={() => setContactModalVisible(true)}
      >
        <View style={styles.myGigsLeft}>
          <View style={[styles.myGigsIconWrapper, { backgroundColor: '#e8f3ef' }]}>
            <Ionicons name="mail-outline" size={22} color="#103B31" />
          </View>
          <View>
            <Text style={styles.myGigsTitle}>{t('profile.contactUs')}</Text>
            <Text style={styles.myGigsSubtitle}>{t('profile.contactUsSub')}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>

      {/* Log Out Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" style={{ marginRight: 6 }} />
        <Text style={styles.logoutButtonText}>{t('profile.logOut')}</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {/* Full Name */}
              <Text style={styles.inputLabel}>{language === 'am' ? 'ሙሉ ስም' : 'Full Name'}</Text>
              <TextInput
                style={[styles.input, !!nameError && styles.inputError]}
                value={fullName}
                onChangeText={handleFullNameChange}
                placeholder="Your full name"
                placeholderTextColor="#94a3b8"
                cursorColor="#103B31"
                selectionColor="#cce3de"
              />
              {nameError ? (
                <View style={styles.inlineErrorRow}>
                  <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
                  <Text style={styles.inlineErrorText}>{nameError}</Text>
                </View>
              ) : null}

              {/* Username */}
              <Text style={styles.inputLabel}>{language === 'am' ? 'የተጠቃሚ ስም' : 'Username'}</Text>
              <View style={[styles.modalUsernameBox, !!usernameError && styles.inputError]}>
                <Text style={styles.modalAtSign}>@</Text>
                <TextInput
                  style={styles.modalUsernameInput}
                  value={username}
                  onChangeText={(val) => {
                    const cleaned = val.replace(/\s+/g, '').toLowerCase();
                    setUsername(cleaned);
                    if (usernameError) setUsernameError(null);
                  }}
                  placeholder="username"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  cursorColor="#103B31"
                  selectionColor="#cce3de"
                />
              </View>
              {usernameError ? (
                <View style={styles.inlineErrorRow}>
                  <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
                  <Text style={styles.inlineErrorText}>{usernameError}</Text>
                </View>
              ) : null}

              {/* About Me with Character Limit */}
              <View style={styles.labelWithCountRow}>
                <Text style={styles.inputLabel}>About Me (Bio)</Text>
                <Text style={styles.charCountText}>
                  {bio.length}/{MAX_BIO_LENGTH}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell neighbors a bit about yourself..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                maxLength={MAX_BIO_LENGTH}
                cursorColor="#103B31"
                selectionColor="#cce3de"
              />

              {/* Selected Skill Tags Display */}
              <View style={styles.labelWithCountRow}>
                <Text style={styles.inputLabel}>Selected Skills ({selectedSkills.length})</Text>
              </View>
              {selectedSkills.length > 0 ? (
                <View style={styles.activeSkillChipsRow}>
                  {selectedSkills.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.selectedChip}
                      onPress={() => handleRemoveSkill(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.selectedChipText}>{s}</Text>
                      <Ionicons name="close-circle" size={15} color="#ffffff" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptySelectedHint}>
                  Tap tags below to pick skills you can offer.
                </Text>
              )}

              {/* Choose from Preset Skill Tags */}
              <Text style={styles.subSectionTitle}>Choose Skill Tags</Text>
              <View style={styles.tagGrid}>
                {PRESET_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <TouchableOpacity
                      key={skill}
                      style={[styles.presetTag, isSelected && styles.presetTagSelected]}
                      onPress={() => toggleSkill(skill)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color="#ffffff"
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.presetTagText,
                          isSelected && styles.presetTagTextSelected,
                        ]}
                      >
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Skill Input */}
              <View style={styles.customSkillRow}>
                <TextInput
                  style={[styles.input, styles.customSkillInput]}
                  value={customSkillInput}
                  onChangeText={setCustomSkillInput}
                  placeholder="Add custom skill (e.g. Babysitting)"
                  placeholderTextColor="#94a3b8"
                  cursorColor="#103B31"
                  selectionColor="#cce3de"
                  onSubmitEditing={handleAddCustomSkill}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.addCustomSkillBtn,
                    !customSkillInput.trim() && styles.addCustomSkillBtnDisabled,
                  ]}
                  onPress={handleAddCustomSkill}
                  disabled={!customSkillInput.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addCustomSkillBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.cancelModalButton}
                  onPress={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelModalButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveModalButton}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveModalButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TrustActionModal
        mode={modalMode}
        actionTitle={actionTitle}
        onClose={closeModal}
        onVerificationSuccess={handleVerificationSuccess}
        navigation={navigation}
      />

      {/* Contact Us Modal */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setContactModalVisible(false)}>
          <View style={styles.contactModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.contactModalCard}>
                {/* Header with Title and 'X' close button */}
                <View style={styles.contactModalHeader}>
                  <View style={styles.contactIconCircle}>
                    <Ionicons name="mail" size={20} color="#103B31" />
                  </View>
                  <TouchableOpacity
                    style={styles.contactCloseBtn}
                    onPress={() => setContactModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.contactTitle}>{t('profile.contactModalTitle')}</Text>
                <Text style={styles.contactDescription}>
                  {t('profile.contactModalDesc')}
                </Text>

                {/* Email Pill / Display */}
                <View style={styles.emailDisplayBox}>
                  <Ionicons name="mail-outline" size={16} color="#103B31" style={{ marginRight: 8 }} />
                  <Text style={styles.emailDisplayText} selectable>
                    {SUPPORT_EMAIL}
                  </Text>
                </View>

                {/* Send Email Action Button */}
                <TouchableOpacity
                  style={styles.sendEmailButton}
                  activeOpacity={0.85}
                  onPress={handleSendEmail}
                >
                  <Ionicons name="paper-plane-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.sendEmailButtonText}>{t('profile.sendEmailBtn')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 130,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  editPenBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#103B31',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  usernameHandle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#103B31',
    marginTop: 2,
    textAlign: 'center',
  },
  setUsernamePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  setUsernamePromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#103B31',
  },
  ratingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 10,
  },
  ratingText: {
    color: '#d97706',
    fontWeight: '700',
    fontSize: 12,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 12,
  },
  unverifiedPill: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  verifiedPillText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  unverifiedPillText: {
    color: '#d97706',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  guestIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f2f7f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  guestTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 26,
  },
  guestSignInBtn: {
    backgroundColor: '#103B31',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  guestSignInBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  guestRulesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  guestRulesBtnText: {
    color: '#103B31',
    fontSize: 14,
    fontWeight: '700',
  },
  bioText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  skillsTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  skillTagBadge: {
    backgroundColor: '#f2f7f5',
    borderWidth: 1,
    borderColor: '#cce3de',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  skillTagText: {
    color: '#103B31',
    fontSize: 12,
    fontWeight: '700',
  },
  addSkillsPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cce3de',
    borderStyle: 'dashed',
  },
  addSkillsPromptText: {
    color: '#103B31',
    fontSize: 12,
    fontWeight: '700',
  },
  myGigsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ede9fe',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  myGigsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  myGigsIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myGigsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  myGigsSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  accountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  accountCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  accountIcon: {
    marginRight: 12,
  },
  accountLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 1,
  },
  usernameActionBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  usernameActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#103B31',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  unverifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  unverifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  accountDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalScroll: {
    paddingTop: 14,
    paddingBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  labelWithCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  charCountText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  modalUsernameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  modalAtSign: {
    fontSize: 16,
    fontWeight: '700',
    color: '#103B31',
    marginRight: 4,
  },
  modalUsernameInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
    paddingVertical: 0,
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  inlineErrorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  textArea: {
    height: 76,
    textAlignVertical: 'top',
  },
  activeSkillChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#103B31',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptySelectedHint: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    marginBottom: 8,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  presetTagSelected: {
    backgroundColor: '#103B31',
    borderColor: '#103B31',
  },
  presetTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetTagTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  customSkillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  customSkillInput: {
    flex: 1,
  },
  addCustomSkillBtn: {
    backgroundColor: '#103B31',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomSkillBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  addCustomSkillBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 15,
  },
  saveModalButton: {
    flex: 1.5,
    backgroundColor: '#103B31',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveModalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  contactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contactModalCard: {
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
  contactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e8f3ef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  contactDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 18,
  },
  emailDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  emailDisplayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#103B31',
    flexShrink: 1,
  },
  sendEmailButton: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#103B31',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendEmailButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
