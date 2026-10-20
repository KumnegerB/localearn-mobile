import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webBackdrop}>
        <View style={styles.webPhoneShell}>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </SafeAreaProvider>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    height: '100vh' as any,
    width: '100%' as any,
    backgroundColor: '#0b1319',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webPhoneShell: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
});
