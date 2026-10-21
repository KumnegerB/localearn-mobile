import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/useChatStore';
import { useRequireTrustAction } from '../../hooks/useRequireTrustAction';
import { TrustActionModal } from '../trust/TrustActionModal';

interface TabItemProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
  badgeCount?: number;
  onPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({
  label,
  iconName,
  isFocused,
  badgeCount,
  onPress,
}) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <Ionicons
          name={iconName}
          size={24}
          color={isFocused ? '#103B31' : '#9ca3af'}
        />
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? '#103B31' : '#9ca3af' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const FloatingBottomNavbar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { width } = useWindowDimensions();
  const unreadCount = useChatStore((s) => s.unreadCount);

  const barMarginHorizontal = 18;
  const maxBarWidth = 440 - barMarginHorizontal * 2;
  const barWidth = Math.min(width - barMarginHorizontal * 2, maxBarWidth);

  const getTabConfig = (routeName: string, focused: boolean) => {
    switch (routeName) {
      case 'Explore':
        return {
          label: 'Home',
          icon: (focused ? 'home' : 'home-outline') as keyof typeof Ionicons.glyphMap,
        };
      case 'Map':
        return {
          label: 'Map',
          icon: (focused ? 'location' : 'location-outline') as keyof typeof Ionicons.glyphMap,
        };
      case 'Inbox':
        return {
          label: 'Inbox',
          icon: (focused ? 'chatbubbles' : 'chatbubbles-outline') as keyof typeof Ionicons.glyphMap,
        };
      case 'Profile':
      default:
        return {
          label: 'Profile',
          icon: (focused ? 'person' : 'person-outline') as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const {
    modalMode,
    actionTitle,
    requireTrustAction,
    closeModal,
    handleVerificationSuccess,
  } = useRequireTrustAction();

  const handleCenterPlusPress = () => {
    requireTrustAction(() => {
      navigation.navigate('CreateTask');
    }, 'post a new gig');
  };

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={[styles.navbarGlassCapsule, { width: barWidth }]}>
        {/* First 2 Tabs: Home & Search (Map) */}
        {state.routes.slice(0, 2).map((route, index) => {
          const isFocused = state.index === index;
          const { label, icon } = getTabConfig(route.name, isFocused);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              label={label}
              iconName={icon}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}

        {/* Center Floating Plus Action Button */}
        <View style={styles.centerSlot}>
          <TouchableOpacity
            style={styles.centerPlusButton}
            activeOpacity={0.85}
            onPress={handleCenterPlusPress}
          >
            <Ionicons name="add" size={30} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Last 2 Tabs: Inbox & Profile */}
        {state.routes.slice(2, 4).map((route, originalIndex) => {
          const index = originalIndex + 2;
          const isFocused = state.index === index;
          const { label, icon } = getTabConfig(route.name, isFocused);
          const badgeCount = route.name === 'Inbox' ? unreadCount : undefined;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              label={label}
              iconName={icon}
              isFocused={isFocused}
              badgeCount={badgeCount}
              onPress={onPress}
            />
          );
        })}
      </View>

      <TrustActionModal
        mode={modalMode}
        actionTitle={actionTitle}
        onClose={closeModal}
        onVerificationSuccess={handleVerificationSuccess}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  navbarGlassCapsule: {
    height: 58,
    // Glassmorphism effect: translucent white + frosted borders
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    // Diffused glass shadow
    shadowColor: '#3b0764',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#FF6B3D',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlusButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B3D',
    alignItems: 'center',
    justifyContent: 'center',
    top: -10,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#FF6B3D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
