import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, AppState, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useTaskStore } from '../store/useTaskStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTranslation } from '../i18n';
import { LanguageSelectorModal } from '../components/common/LanguageSelectorModal';
import { navigationRef } from './navigationRef';
import { SiraLogo } from '../components/common/SiraLogo';
import { InAppNotificationBanner } from '../components/chat/InAppNotificationBanner';
import { LandingScreen } from '../screens/auth/LandingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { EmailVerificationScreen } from '../screens/auth/EmailVerificationScreen';
import { TaskListScreen } from '../screens/explore/TaskListScreen';
import { TaskMapScreen } from '../screens/explore/TaskMapScreen';
import { MyJobsScreen } from '../screens/jobs/MyJobsScreen';
import { TaskCandidatesScreen } from '../screens/jobs/TaskCandidatesScreen';
import { InboxScreen } from '../screens/chat/InboxScreen';
import { TaskDetailScreen } from '../screens/task/TaskDetailScreen';
import { CreateTaskScreen } from '../screens/task/CreateTaskScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { LeaveReviewScreen } from '../screens/task/LeaveReviewScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { NotificationScreen } from '../screens/notifications/NotificationScreen';
import { RulesAndResponsibilitiesScreen } from '../screens/rules/RulesAndResponsibilitiesScreen';
import { FloatingBottomNavbar } from '../components/navigation/FloatingBottomNavbar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HeaderRightActions = ({ navigation }: { navigation: any }) => {
  const [langModalVisible, setLangModalVisible] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
        {/* World / Globe language picker icon button - plain, no card */}
        <TouchableOpacity
          onPress={() => setLangModalVisible(true)}
          style={{ padding: 6, marginRight: 6 }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="globe-outline" size={24} color="#103B31" />
        </TouchableOpacity>

        {/* Notifications Icon Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={{ position: 'relative', padding: 6 }}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color="#103B31" />
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: '#FF6B3D',
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 3,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </>
  );
};

// Bottom tabs for Explore (Home), Map (Search), Inbox, and Profile
// (Center slot is the floating action plus button, My Jobs moved inside Profile & Stack)
function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingBottomNavbar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={TaskListScreen}
        options={({ navigation }: any) => ({
          headerTitle: () => <SiraLogo width={50} />,
          headerRight: () => <HeaderRightActions navigation={navigation} />,
        })}
      />
      <Tab.Screen
        name="Map"
        component={TaskMapScreen}
        options={{ title: t('nav.map') }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ title: t('nav.inbox') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('nav.profile') }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  const { t } = useTranslation();
  const { user, isCheckingAuth, checkAuth } = useAuthStore();
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const fetchMyAppliedTasks = useTaskStore((s) => s.fetchMyAppliedTasks);
  const fetchReceivedApplications = useTaskStore((s) => s.fetchReceivedApplications);
  const pollUnreadNotifications = useNotificationStore((s) => s.pollUnreadCount);

  useEffect(() => {
    checkAuth();
  }, []);

  // Background polling for conversations, messages, notifications & alerts
  useEffect(() => {
    if (!user?.id) return;

    fetchConversations(user.id);
    fetchMyAppliedTasks();
    fetchReceivedApplications();
    pollUnreadNotifications();

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        fetchConversations(user.id);
        fetchMyAppliedTasks();
        fetchReceivedApplications();
        pollUnreadNotifications();
      }
    }, 4000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        fetchConversations(user.id);
        fetchMyAppliedTasks();
        fetchReceivedApplications();
        pollUnreadNotifications();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [user?.id]);

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#103B31" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <InAppNotificationBanner />
      <Stack.Navigator initialRouteName={user ? 'Main' : 'Landing'}>
        {/* Landing Page (Welcome screen with single Continue button for guests) */}
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
          options={{ headerShown: false }}
        />
        {/* Main App (Progressive Trust: accessible to guests & authenticated users) */}
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TaskDetail"
          component={TaskDetailScreen}
          options={{ title: t('taskDetail.title') }}
        />
        <Stack.Screen
          name="CreateTask"
          component={CreateTaskScreen}
          options={{ title: t('createTask.title') }}
        />
        <Stack.Screen
          name="TaskCandidates"
          component={TaskCandidatesScreen}
          options={{ title: t('taskDetail.applicants') }}
        />
        <Stack.Screen
          name="MyJobs"
          component={MyJobsScreen}
          options={{ title: t('profile.myGigsTitle') }}
        />
        <Stack.Screen
          name="ChatRoom"
          component={ChatRoomScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LeaveReview"
          component={LeaveReviewScreen}
          options={{ title: 'Leave Review' }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{ title: t('nav.notifications') }}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={{ headerShown: false }}
        />

        {/* Rules & Responsibilities Screen */}
        <Stack.Screen
          name="RulesAndResponsibilities"
          component={RulesAndResponsibilitiesScreen}
          options={{ headerShown: false }}
        />

        {/* Auth Screens (Action-Gated entry points) */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EmailVerification"
          component={EmailVerificationScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

