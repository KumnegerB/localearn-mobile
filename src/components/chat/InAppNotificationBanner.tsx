import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/useChatStore';
import { navigate } from '../../navigation/navigationRef';

export const InAppNotificationBanner: React.FC = () => {
  const activeNotification = useChatStore((s) => s.activeNotification);
  const dismissNotification = useChatStore((s) => s.dismissNotification);

  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeNotification) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeNotification]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissNotification();
    });
  };

  const handlePress = () => {
    if (!activeNotification) return;
    const notif = activeNotification;
    handleDismiss();
    if (notif.type === 'APPLICATION_ACCEPTED') {
      navigate('TaskDetail', { taskId: notif.taskId });
    } else if (notif.type === 'NEW_CANDIDATE') {
      navigate('TaskCandidates', { taskId: notif.taskId, taskTitle: notif.taskTitle });
    } else {
      navigate('ChatRoom', {
        taskId: notif.taskId,
        taskTitle: notif.taskTitle,
        otherUser: notif.otherUser,
      });
    }
  };

  if (!activeNotification) return null;

  const isAcceptedType = activeNotification.type === 'APPLICATION_ACCEPTED';
  const isCandidateType = activeNotification.type === 'NEW_CANDIDATE';

  const iconName = isAcceptedType ? 'trophy' : isCandidateType ? 'people' : 'chatbubbles';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[
          styles.card,
          isAcceptedType && styles.acceptedCard,
          isCandidateType && styles.candidateCard,
        ]}
        activeOpacity={0.92}
        onPress={handlePress}
      >
        <View
          style={[
            styles.iconCircle,
            isAcceptedType && styles.acceptedIconCircle,
            isCandidateType && styles.candidateIconCircle,
          ]}
        >
          <Ionicons name={iconName} size={20} color="#ffffff" />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              style={[
                styles.senderName,
                isAcceptedType && styles.acceptedSenderName,
                isCandidateType && styles.candidateSenderName,
              ]}
              numberOfLines={1}
            >
              {isAcceptedType || isCandidateType
                ? activeNotification.title
                : activeNotification.senderName}
            </Text>
            <Text style={styles.tagText} numberOfLines={1}>
              • {activeNotification.taskTitle}
            </Text>
          </View>
          <Text style={styles.messageText} numberOfLines={1}>
            {activeNotification.message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const topOffset = Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 10;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: topOffset,
    left: 14,
    right: 14,
    zIndex: 99999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#d1e3dd',
    shadowColor: '#103B31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 9,
  },
  acceptedCard: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  acceptedIconCircle: {
    backgroundColor: '#103B31',
  },
  acceptedSenderName: {
    color: '#103B31',
  },
  candidateCard: {
    borderColor: '#fed7aa',
    backgroundColor: '#fffaf5',
  },
  candidateIconCircle: {
    backgroundColor: '#FF6B3D',
  },
  candidateSenderName: {
    color: '#c2410c',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF6B3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: '55%',
  },
  tagText: {
    fontSize: 12,
    color: '#103B31',
    fontWeight: '700',
    marginLeft: 4,
    flex: 1,
  },
  messageText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 2,
  },
});

