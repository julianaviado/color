import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import QuizScreen from '../screens/QuizScreen';
import ResultsGateScreen from '../screens/ResultsGateScreen';
import AuthScreen from '../screens/AuthScreen';
import ResultsScreen from '../screens/ResultsScreen';
import PaletteScreen from '../screens/PaletteScreen';
import ColorMatchScreen from '../screens/ColorMatchScreen';
import GiftsScreen from '../screens/GiftsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash"       component={SplashScreen} />
      <Stack.Screen name="Quiz"         component={QuizScreen} />
      <Stack.Screen name="ResultsGate"  component={ResultsGateScreen} />
      <Stack.Screen name="Auth"         component={AuthScreen} />
      <Stack.Screen name="Results"      component={ResultsScreen} />
      <Stack.Screen name="Palette"      component={PaletteScreen} />
      <Stack.Screen name="ColorMatch"   component={ColorMatchScreen} />
      <Stack.Screen name="Gifts"        component={GiftsScreen} />
      <Stack.Screen name="Profile"      component={ProfileScreen} />
    </Stack.Navigator>
  );
}
