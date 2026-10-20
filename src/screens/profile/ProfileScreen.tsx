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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { validateFullName } from '../../utils/validators';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, updateProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills || '');
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleOpenEdit = () => {
    setFullName(user?.full_name || '');
    setBio(user?.bio || '');
    setSkills(user?.skills || '');
    setNameError(null);
    setIsEditing(true);
  };

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (nameError) setNameError(null);
  };

  const handleSaveProfile = async () => {
    const err = validateFullName(fullName);
    if (err) {
      setNameError(err);
      return;
    }
    setNameError(null);

    setIsSaving(true);
    const success = await updateProfile({
      full_name: fullName.trim(),
      bio: bio.trim(),
      skills: skills.trim(),
    });
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved.');
    } else {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name}</Text>

        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>
            {user?.rating_count && user.rating_count > 0
              ? `★ ${user.rating.toFixed(1)} (${user.rating_count} reviews)`
              : '0 reviews'}
          </Text>
        </View>

        <TouchableOpacity style={styles.editProfileButton} onPress={handleOpenEdit}>
          <Ionicons name="create-outline" size={16} color="#2563eb" style={{ marginRight: 6 }} />
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
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
            <Text style={styles.myGigsTitle}>My Gigs & Applications</Text>
            <Text style={styles.myGigsSubtitle}>Jobs you posted and gigs you applied for</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>

      {/* Info Sections */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>About Me</Text>
        </View>
        <Text style={styles.sectionBody}>
          {user?.bio && user.bio.trim()
            ? user.bio
            : 'No bio added yet. Tap "Edit Profile" to add your introduction!'}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Skills & Offers</Text>
        </View>
        <Text style={styles.sectionBody}>
          {user?.skills && user.skills.trim()
            ? user.skills
            : 'No skills listed yet. Tap "Edit Profile" to share what services or help you offer.'}
        </Text>
      </View>

      {/* Log Out Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" style={{ marginRight: 6 }} />
        <Text style={styles.logoutButtonText}>Log Out</Text>
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
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={[styles.input, !!nameError && styles.inputError]}
                value={fullName}
                onChangeText={handleFullNameChange}
                placeholder="Your full name"
                placeholderTextColor="#94a3b8"
                cursorColor="#7c3aed"
                selectionColor="#ddd6fe"
              />
              {nameError ? (
                <View style={styles.inlineErrorRow}>
                  <Ionicons name="alert-circle" size={13} color="#ef4444" style={{ marginRight: 4 }} />
                  <Text style={styles.inlineErrorText}>{nameError}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>About Me (Bio)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell neighbors a bit about yourself..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                cursorColor="#7c3aed"
                selectionColor="#ddd6fe"
              />

              <Text style={styles.inputLabel}>Skills & Offers</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={skills}
                onChangeText={setSkills}
                placeholder="e.g. Lawn mowing, Furniture assembly, Dog walking, Math tutoring"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                cursorColor="#7c3aed"
                selectionColor="#ddd6fe"
              />

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#103B31',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#103B31',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  ratingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 8,
  },
  ratingText: {
    color: '#d97706',
    fontWeight: '700',
    fontSize: 13,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  editProfileButtonText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  myGigsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ede9fe',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.06,
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
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myGigsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  myGigsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionBody: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
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
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
});
