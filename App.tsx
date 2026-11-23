import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import DashboardScreen from './screens/DashboardScreen';
import WorkoutLogScreen from './screens/WorkoutLogScreen';
import LogWorkoutScreen from './screens/LogWorkoutScreen';
import RoutinesScreen from './screens/RoutinesScreen';
import ProgressScreen from './screens/ProgressScreen';
import {
  navTheme, headerOptions, colors,
  Orbitron_600SemiBold, Orbitron_800ExtraBold,
  Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold,
  JetBrainsMono_400Regular, JetBrainsMono_700Bold,
} from './theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Orbitron_600SemiBold, Orbitron_800ExtraBold,
    Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold,
    JetBrainsMono_400Regular, JetBrainsMono_700Bold,
  });

  // Wait for fonts, but never block forever: on error we fall back to system fonts.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <Stack.Navigator initialRouteName="Dashboard" screenOptions={headerOptions}>
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard', headerShown: false }} />
          <Stack.Screen name="WorkoutLog" component={WorkoutLogScreen} options={{ title: 'Workout Log' }} />
          <Stack.Screen name="LogWorkout" component={LogWorkoutScreen} options={{ title: 'Log Workout' }} />
          <Stack.Screen name="Routines" component={RoutinesScreen} options={{ title: 'Routines' }} />
          <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
