import React, { useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';

import HomeScreen        from './src/screens/HomeScreen';
import EnrollScreen      from './src/screens/EnrollScreen';
import AuthenticateScreen from './src/screens/AuthenticateScreen';
import StatusScreen      from './src/screens/StatusScreen';
import ResultScreen      from './src/screens/ResultScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Light':    require('./assets/fonts/Inter-Light.ttf'),
    'Inter-Regular':  require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium':   require('./assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold':     require('./assets/fonts/Inter-Bold.ttf'),
  });

  const onReady = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onReady}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home"         component={HomeScreen} />
          <Stack.Screen name="Enroll"       component={EnrollScreen} />
          <Stack.Screen name="Authenticate" component={AuthenticateScreen} />
          <Stack.Screen name="Status"       component={StatusScreen} />
          <Stack.Screen name="Result"       component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
