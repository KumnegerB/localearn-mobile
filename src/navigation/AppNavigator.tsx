import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useTaskStore } from '../store/useTaskStore';
import { navigationRef } from './navigationRef';
import { SiraLogo } from '../components/common/SiraLogo';
import { InAppNotificationBanner } from '../components/chat/InAppNotificationBanner';
import { LandingScreen } from '../screens/auth/LandingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
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
import { FloatingBottomNavbar } from '../components/navigation/FloatingBottomNavbar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tabs for Explore (Home), Map (Search), Inbox, and Profile
// (Center slot is the floating action plus button, My Jobs moved inside Profile & Stack)
function MainTabs() {
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
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SiraLogo width={42} />
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#103B31', marginLeft: 8 }}>
                ስራ
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={TaskMapScreen}
        options={{ title: 'Nearby Map' }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator = () => {
  const { user, isCheckingAuth, checkAuth } = useAuthStore();
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const fetchMyAppliedTasks = useTaskStore((s) => s.fetchMyAppliedTasks);
  const fetchReceivedApplications = useTaskStore((s) => s.fetchReceivedApplications);

  useEffect(() => {
    checkAuth();
  }, []);

  // Background polling for conversations, messages, application acceptances & candidate alerts
  useEffect(() => {
    if (!user?.id) return;

    fetchConversations(user.id);
    fetchMyAppliedTasks();
    fetchReceivedApplications();

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        fetchConversations(user.id);
        fetchMyAppliedTasks();
        fetchReceivedApplications();
      }
    }, 4000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        fetchConversations(user.id);
        fetchMyAppliedTasks();
        fetchReceivedApplications();
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
      <Stack.Navigator>
        {user ? (
          // Authenticated App Stack
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MyJobs"
              component={MyJobsScreen}
              options={{ title: 'My Gigs & Applications' }}
            />
            <Stack.Screen
              name="TaskCandidates"
              component={TaskCandidatesScreen}
              options={{ title: 'Candidates' }}
            />
            <Stack.Screen
              name="TaskDetail"
              component={TaskDetailScreen}
              options={{ title: 'Task Details' }}
            />
            <Stack.Screen
              name="CreateTask"
              component={CreateTaskScreen}
              options={{ title: 'Post a Gig' }}
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
              name="UserProfile"
              component={UserProfileScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Auth Stack
          <>
            <Stack.Screen
              name="Landing"
              component={LandingScreen}
              options={{ headerShown: false }}
            />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

