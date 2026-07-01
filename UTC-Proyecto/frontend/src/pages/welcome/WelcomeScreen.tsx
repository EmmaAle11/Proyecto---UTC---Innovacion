import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, ShieldCheck, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { LogoLockup } from '../../shared/ui/LogoLockup';
import { Title, Body, Label } from '../../shared/ui/Type';
import { colors, text, surface, shadow } from '../../shared/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

/**
 * Landing (identidad "Editorial Street-Food", D-020): el usuario elige si entra
 * como Cliente o como Administrador. Marca "UTC Pick Sazón" en Display + acento
 * naranja, y las dos rutas como tarjetas grandes (naranja cliente / navy admin).
 */
export function WelcomeScreen({ navigation }: Props) {
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
        {/* marca + eslogan (el nombre ya viene en el logo) */}
        <View style={{ marginTop: 36, alignItems: 'center' }}>
          <LogoLockup width={260} />
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 18 }} />
          <Body color={text.muted} style={{ fontSize: 15, marginTop: 12, textAlign: 'center' }}>
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

        <Label style={{ textAlign: 'center', letterSpacing: 0.4, textTransform: 'none' }}>
          Modalidad Pick Up · Solo recogida en tienda
        </Label>
      </ScrollView>
    </SafeAreaView>
  );
}
