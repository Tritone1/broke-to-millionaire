import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BudgetScreen } from '../screens/BudgetScreen';
import { AvatarDebugScreen } from '../screens/AvatarDebugScreen';
import { CareerScreen } from '../screens/CareerScreen';
import { CasinoScreen } from '../screens/CasinoScreen';
import { CompanyScreen } from '../screens/CompanyScreen';
import { LifeHomeScreen } from '../screens/LifeHomeScreen';
import { LivingScreen } from '../screens/LivingScreen';
import { MarketScreen } from '../screens/MarketScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PurchaseScreen } from '../screens/PurchaseScreen';
import { StudyScreen } from '../screens/StudyScreen';
import { WorkScreen } from '../screens/WorkScreen';
import { WellnessScreen } from '../screens/WellnessScreen';
import { colors } from '../theme';

export type LifeTabParamList = { Home: undefined; Career: undefined; Business: undefined; Market: undefined; More: undefined };
export type LifeRootParamList = { Tabs: undefined; Work: undefined; Study: undefined; Casino: undefined; Living: undefined; Wellness: undefined; Budget: undefined; Profile: undefined; Store: undefined; AvatarDebug: undefined };

const Tab = createBottomTabNavigator<LifeTabParamList>();
const Stack = createNativeStackNavigator<LifeRootParamList>();
const navigationTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.gold } };

function LifeTabs() {
  const search = (globalThis as { location?: { search?: string } }).location?.search;
  const requested = search ? new URLSearchParams(search).get('screen') : null;
  const initialRouteName: keyof LifeTabParamList = requested === 'Career' || requested === 'Business' || requested === 'Market' || requested === 'More' ? requested : 'Home';
  return (
    <Tab.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false, lazy: true, animation: 'shift', tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Home" component={LifeHomeScreen} />
      <Tab.Screen name="Career" component={CareerScreen} />
      <Tab.Screen name="Business" component={CompanyScreen} />
      <Tab.Screen name="Market" component={MarketScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#FFF8E8' }, headerTintColor: '#17364C', headerTitleStyle: { fontWeight: '900' }, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
        <Stack.Screen name="Tabs" component={LifeTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Work" component={WorkScreen} options={{ title: 'Work' }} />
        <Stack.Screen name="Study" component={StudyScreen} options={{ title: 'Study' }} />
        <Stack.Screen name="Casino" component={CasinoScreen} options={{ title: 'Casino' }} />
        <Stack.Screen name="Living" component={LivingScreen} options={{ title: 'Life & Family' }} />
        <Stack.Screen name="Wellness" component={WellnessScreen} options={{ title: 'Health & Happiness' }} />
        <Stack.Screen name="Budget" component={BudgetScreen} options={{ title: 'Monthly Budget' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile & Settings' }} />
        <Stack.Screen name="Store" component={PurchaseScreen} options={{ title: 'Game Store' }} />
        {__DEV__ ? <Stack.Screen name="AvatarDebug" component={AvatarDebugScreen} options={{ title: 'Avatar Debug' }} /> : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
