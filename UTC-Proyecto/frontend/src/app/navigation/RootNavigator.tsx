import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { WelcomeScreen } from '../../pages/welcome/WelcomeScreen';
import { LoginUsuarioScreen } from '../../pages/auth/LoginUsuarioScreen';
import { LoginAdminScreen } from '../../pages/auth/LoginAdminScreen';
import { MainTabs } from './MainTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="LoginUsuario" component={LoginUsuarioScreen} />
        <Stack.Screen name="LoginAdmin" component={LoginAdminScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
