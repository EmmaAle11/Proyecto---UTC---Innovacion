import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, ShieldCheck, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { LogoLockup } from '../../shared/ui/LogoLockup';
import { Display, Title, Body, Label } from '../../shared/ui/Type';
import { colors, text, surface, shadow, border, fonts } from '../../shared/theme';
import { useSessionStore } from '../../features/auth/model/session.store';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

/**
 * Landing (identidad "Editorial Street-Food", D-020): el usuario elige si entra
 * como Cliente o como Administrador. Marca "UTC Pick Sazón" en Display + acento
 * naranja, y las dos rutas como tarjetas grandes (naranja cliente / navy admin).
 */
export function WelcomeScreen({ navigation }: Props) {
  const setSession = useSessionStore((s) => s.setSession);
  // Acceso SOLO en desarrollo: entra sin tocar el backend (para probar la UI por
  // túnel cuando el servidor no es alcanzable). No aparece en builds de producción.
  const devEnter = (role: 'user' | 'admin') =>
    setSession({
      accessToken: 'dev',
      refreshToken: 'dev',
      email: role === 'admin' ? 'admin@picksazon.app' : 'demo@edu.utc.mx',
      role,
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface.page }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingHorizontal: 28,
          paddingVertical: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* marca + hero editorial */}
        <View style={{ marginTop: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <LogoLockup width={250} />
          </View>
          <Display style={{ marginTop: 26 }}>UTC{'\n'}Pick Sazón</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 12 }} />
          <Body color={text.muted} style={{ fontSize: 15, marginTop: 12 }}>
            Pide fácil, recoge con sabor.
          </Body>
        </View>

        {/* elección de rol */}
        <View style={{ gap: 14, marginVertical: 28 }}>
          <Label style={{ marginBottom: 2 }}>¿Cómo quieres entrar?</Label>

          <Pressable
            onPress={() => navigation.navigate('LoginUsuario')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              borderRadius: 20,
              backgroundColor: colors.naranja[500],
              padding: 18,
              ...shadow.card,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag color="#fff" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Title color={text.onInk} style={{ fontSize: 18 }}>Soy Cliente</Title>
              <Body color="rgba(255,255,255,0.85)" style={{ fontSize: 13, marginTop: 2 }}>
                Estudiante · pide y recoge tu antojo
              </Body>
            </View>
            <ChevronRight color="#fff" size={22} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('LoginAdmin')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              borderRadius: 20,
              backgroundColor: surface.ink,
              padding: 18,
              ...shadow.card,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck color={colors.naranja[400]} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Title color={text.onInk} style={{ fontSize: 18 }}>Soy Administrador</Title>
              <Body color={text.onInkMuted} style={{ fontSize: 13, marginTop: 2 }}>
                Cocina · gestiona productos y pedidos
              </Body>
            </View>
            <ChevronRight color="#fff" size={22} />
          </Pressable>
        </View>

        {__DEV__ ? (
          <View style={{ marginBottom: 14, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: border.subtle, backgroundColor: surface.card, ...shadow.card }}>
            <Label style={{ marginBottom: 9 }}>Solo desarrollo · entrar sin servidor</Label>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => devEnter('user')} style={{ flex: 1, height: 40, borderRadius: 11, borderWidth: 1, borderColor: colors.naranja[300], backgroundColor: colors.naranja[50], alignItems: 'center', justifyContent: 'center' }}>
                <Body color={colors.naranja[700]} style={{ fontSize: 13.5, fontFamily: fonts.bodyBold }}>Cliente demo</Body>
              </Pressable>
              <Pressable onPress={() => devEnter('admin')} style={{ flex: 1, height: 40, borderRadius: 11, borderWidth: 1, borderColor: colors.azul[200], backgroundColor: colors.azul[50], alignItems: 'center', justifyContent: 'center' }}>
                <Body color={colors.azul[700]} style={{ fontSize: 13.5, fontFamily: fonts.bodyBold }}>Admin demo</Body>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Label style={{ textAlign: 'center', letterSpacing: 0.4, textTransform: 'none' }}>
          Modalidad Pick Up · Solo recogida en tienda
        </Label>
      </ScrollView>
    </SafeAreaView>
  );
}
