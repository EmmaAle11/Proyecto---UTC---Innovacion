import './global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { colors } from './src/shared/theme/tokens';

export default function App() {
  // Las claves = nombres de familia usados en tokens.fonts (shared/theme/tokens).
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  // Red de seguridad: si las fuentes tardan/fallan (p. ej. por túnel lento), no nos
  // quedamos en el splash para siempre — a los 6 s renderizamos igual (fuente del
  // sistema como fallback). Evita la "pantalla en blanco" colgada.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded && !fontError && !timedOut) {
    return (
      <View style={styles.splash}>
        <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator color={colors.naranja[400]} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.azul[900] },
  logo: { width: 120, height: 120 },
});
