import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { WelcomeScreen } from '../../pages/welcome/WelcomeScreen';
import { LoginUsuarioScreen } from '../../pages/auth/LoginUsuarioScreen';
import { LoginAdminScreen } from '../../pages/auth/LoginAdminScreen';
import { MainTabs } from './MainTabs';
import { useSessionStore } from '../../features/auth/model/session.store';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Guard de sesión (hallazgo #7): `Main` solo existe en el stack cuando hay sesión.
 * Sin sesión, las pantallas internas son inalcanzables; el login marca la sesión
 * (setSession) y el navegador cambia automáticamente a `Main`.
 */
export function RootNavigator() {
  const session = useSessionStore((s) => s.session);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Group>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="LoginUsuario" component={LoginUsuarioScreen} />
            <Stack.Screen name="LoginAdmin" component={LoginAdminScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
