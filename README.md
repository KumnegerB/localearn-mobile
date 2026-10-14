# LocalEarn Mobile

React Native + Expo mobile application for **LocalEarn**, allowing neighbors to discover, post, complete gigs, chat in real-time, and leave ratings.

---

## Tech Stack
- **Framework**: React Native + Expo (TypeScript)
- **Navigation**: React Navigation (Native Stack + Bottom Tabs)
- **State Management**: Zustand
- **Storage**: AsyncStorage (Persisted JWT sessions)
- **Networking**: Axios (JWT interceptors & automatic injection)
- **Maps**: `react-native-maps` + `expo-location`
- **Real-time Chat**: Native WebSockets

---

## Folder Structure
```text
LocalEarn-mobile/
├── assets/                          # App icons and splash screens
├── src/
│   ├── api/
│   │   └── client.ts                # Axios instance with JWT interceptors
│   ├── config/
│   │   └── env.ts                   # Host URL config (Android 10.0.2.2 vs iOS localhost)
│   ├── components/
│   │   └── task/
│   │       └── TaskCard.tsx         # Task gig card
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Auth & Main Navigation
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx      # Sign in
│   │   │   └── RegisterScreen.tsx   # Sign up
│   │   ├── explore/
│   │   │   ├── TaskListScreen.tsx   # Filterable list view
│   │   │   └── TaskMapScreen.tsx    # Interactive map view with custom markers
│   │   ├── task/
│   │   │   ├── TaskDetailScreen.tsx # Details & Accept/Complete gig
│   │   │   ├── CreateTaskScreen.tsx # Post new task with GPS
│   │   │   └── LeaveReviewScreen.tsx# Star rating and feedback
│   │   ├── chat/
│   │   │   └── ChatRoomScreen.tsx   # Real-time WebSocket chat room
│   │   └── profile/
│   │       └── ProfileScreen.tsx    # User bio, rating, skills, sign out
│   ├── store/
│   │   ├── useAuthStore.ts          # Auth state & token storage
│   │   ├── useTaskStore.ts          # Task discovery & filters
│   │   └── useChatStore.ts          # Real-time messages & WebSocket connection
│   └── types/
│       └── index.ts                 # Shared TypeScript models
├── App.tsx                          # App root
├── app.json
└── package.json
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend Host (Optional)
If running on a physical phone via Expo Go, open `src/config/env.ts` and set your computer's local Wi-Fi IP address:
```typescript
return 'http://192.168.1.xxx:8000';
```
*(By default, Android emulator automatically uses `http://10.0.2.2:8000` and iOS simulator uses `http://localhost:8000`)*

### 3. Start Expo Development Server
```bash
npx expo start
```
- Press `a` to open Android Emulator
- Press `i` to open iOS Simulator
- Scan the QR code with **Expo Go** on your physical Android or iPhone.

