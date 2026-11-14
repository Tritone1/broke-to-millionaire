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
import { useTranslation } from '../hooks/useTranslation';

export type LifeTabParamList = { Home: undefined; Career: undefined; Business: undefined; Market: undefined; More: undefined };
export type LifeRootParamList = { Tabs: undefined; Work: undefined; Study: undefined; Casino: undefined; Living: undefined; Wellness: { focus?: 'energy' | 'health' | 'happiness' } | undefined; Budget: undefined; Profile: undefined; Store: undefined; AvatarDebug: undefined };

const Tab = createBottomTabNavigator<LifeTabParamList>();
const Stack = createNativeStackNavigator<LifeRootParamList>();
const navigationTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.gold } };

function LifeTabs() {
  const { t } = useTranslation();
  const search = (globalThis as { location?: { search?: string } }).location?.search;
  const requested = search ? new URLSearchParams(search).get('screen') : null;
  const initialRouteName: keyof LifeTabParamList = requested === 'Career' || requested === 'Business' || requested === 'Market' || requested === 'More' ? requested : 'Home';
  return (
    <Tab.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false, lazy: true, animation: 'shift', tabBarStyle: { display: 'none' } }}>
      <Tab.Screen name="Home" component={LifeHomeScreen} options={{ tabBarLabel: t('home') }} />
      <Tab.Screen name="Career" component={CareerScreen} options={{ tabBarLabel: t('career') }} />
      <Tab.Screen name="Business" component={CompanyScreen} options={{ tabBarLabel: t('business') }} />
      <Tab.Screen name="Market" component={MarketScreen} options={{ tabBarLabel: t('market') }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarLabel: t('more') }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { t } = useTranslation();
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#FFF8E8' }, headerTintColor: '#17364C', headerTitleStyle: { fontWeight: '900' }, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
        <Stack.Screen name="Tabs" component={LifeTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Work" component={WorkScreen} options={{ title: t('work') }} />
        <Stack.Screen name="Study" component={StudyScreen} options={{ title: t('study') }} />
        <Stack.Screen name="Casino" component={CasinoScreen} options={{ title: t('casino') }} />
        <Stack.Screen name="Living" component={LivingScreen} options={{ title: t('living') }} />
        <Stack.Screen name="Wellness" component={WellnessScreen} options={{ title: t('wellness') }} />
        <Stack.Screen name="Budget" component={BudgetScreen} options={{ title: t('budget') }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
        <Stack.Screen name="Store" component={PurchaseScreen} options={{ title: t('store') }} />
        {__DEV__ ? <Stack.Screen name="AvatarDebug" component={AvatarDebugScreen} options={{ title: 'Avatar Debug' }} /> : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
