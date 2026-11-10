import React, { useEffect, useState } from 'react';
import { View, Image, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import FavoritesScreen from '../screens/FavoritesScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Giữ màn hình Splash hiển thị logo icon.png trong 1.5 giây khi mở app
        const [user] = await Promise.all([
          AsyncStorage.getItem('user'),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
        setInitialRoute(user ? 'Home' : 'Login');
      } catch {
        setInitialRoute('Login');
      }
    };

    initApp();
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#059669" style={styles.spinner} />
        <Text style={styles.splashSubtitle}>Khám phá vẻ đẹp Việt Nam</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  splashLogo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 12,
  },
  splashSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
  },
});