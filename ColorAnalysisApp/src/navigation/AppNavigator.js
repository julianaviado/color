import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SplashScreen      from '../screens/SplashScreen';
import QuizScreen        from '../screens/QuizScreen';
import ResultsGateScreen from '../screens/ResultsGateScreen';
import AuthScreen        from '../screens/AuthScreen';
import ResultsScreen     from '../screens/ResultsScreen';
import PaletteScreen     from '../screens/PaletteScreen';
import ColorMatchScreen  from '../screens/ColorMatchScreen';
import GiftsScreen       from '../screens/GiftsScreen';
import ProfileScreen     from '../screens/ProfileScreen';
import FriendsScreen     from '../screens/FriendsScreen';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ─────────────────────────────────────────────
// Main tab navigator — shown after auth
// ─────────────────────────────────────────────

function MainTabs({ route }) {
  const { result } = route.params ?? {};

  return (
    <Tab.Navigator
      screenOptions={({ route: tabRoute }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   COLORS.accent,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={tabRoute.name} focused={focused} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Results"
        component={ResultsScreen}
        initialParams={{ result }}
        options={{ tabBarLabel: 'Me' }}
      />
      <Tab.Screen
        name="Palette"
        component={PaletteScreen}
        initialParams={{ result }}
        options={{ tabBarLabel: 'Palette' }}
      />
      <Tab.Screen
        name="ColorMatch"
        component={ColorMatchScreen}
        initialParams={{ result }}
        options={{ tabBarLabel: 'Shop' }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ tabBarLabel: 'Friends' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ result }}
        options={{ tabBarLabel: 'Card' }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ name, focused, color }) {
  const icons = {
    Results:    focused ? '◉' : '○',
    Palette:    focused ? '▪' : '▫',
    ColorMatch: focused ? '◎' : '◎',
    Friends:    focused ? '♥' : '♡',
    Profile:    focused ? '▨' : '▧',
  };
  return (
    <Text style={{ fontSize: 16, color, marginBottom: -2 }}>
      {icons[name] ?? '○'}
    </Text>
  );
}

// ─────────────────────────────────────────────
// Root stack — pre-auth screens + main tabs
// ─────────────────────────────────────────────

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
      <Stack.Screen name="Main"         component={MainTabs} />
      {/* Kept as standalone screens accessible from tabs via navigation.navigate */}
      <Stack.Screen name="Gifts"        component={GiftsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FAF8F5',
    borderTopColor: '#E8E0D8',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: 'AlbertSans_400Regular',
    marginTop: 2,
  },
});
