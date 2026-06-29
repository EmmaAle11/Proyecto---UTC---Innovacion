import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Wallet, Bell, ShieldCheck, CircleHelp, ChevronRight, LogOut } from 'lucide-react-native';
import { Display, Heading, Title, Body, Mono } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow, fonts } from '../../shared/theme';
import { useSessionStore } from '../../features/auth/model/session.store';
import type { MainStackParamList } from '../../app/navigation/types';

const ROWS = [
  { i: Wallet, l: 'Métodos de pago', s: 'Mercado Pago, PayPal, TDC/TDD, efectivo', to: 'Wallet' as const },
  { i: Bell, l: 'Notificaciones', s: 'Avisos de "listo para recoger"' },
  { i: ShieldCheck, l: 'Cuenta y seguridad', s: 'Sesión con tu correo @edu.utc.mx' },
  { i: CircleHelp, l: 'Ayuda', s: 'Sobre la cooperativa y el Pick Up' },
] as const;

/** Pestaña Perfil: tarjeta de cuenta + ajustes + cerrar sesión (vuelve a Welcome). */
export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const session = useSessionStore((s) => s.session);
  const clear = useSessionStore((s) => s.clear);

  const email = session?.email ?? '';
  const localPart = email.split('@')[0] ?? '';
  const words = localPart.split(/[._-]+/).filter(Boolean);
  const name = words.slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Alumno UTC';
  const initials = ((words[0]?.[0] ?? 'U') + (words[1]?.[0] ?? '')).toUpperCase();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* TÍTULO editorial con barrita de acento */}
        <View style={{ paddingTop: 4, paddingBottom: 18 }}>
          <Display>Tu cuenta</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 10 }} />
        </View>

        {/* TARJETA DE PERFIL — cabecera navy editorial */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: surface.ink, borderRadius: 20, marginBottom: 18, ...shadow.card }}>
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.naranja[500], alignItems: 'center', justifyContent: 'center' }}>
            <Mono style={{ fontFamily: fonts.monoBold, fontSize: 21 }} color={text.onInk}>{initials}</Mono>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Heading style={{ fontSize: 20, lineHeight: 24 }} color={text.onInk} numberOfLines={1}>{name}</Heading>
            <Body style={{ fontSize: 13 }} color={text.onInkMuted} numberOfLines={1}>{email || 'cuenta@edu.utc.mx'}</Body>
          </View>
        </View>

        {/* LISTA DE AJUSTES */}
        <View style={{ backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, borderRadius: 18, overflow: 'hidden', marginBottom: 18, ...shadow.card }}>
          {ROWS.map((r, i) => {
            const Icon = r.i;
            const to = 'to' in r ? r.to : undefined;
            return (
              <Pressable
                key={r.l}
                onPress={to ? () => navigation.navigate(to) : undefined}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: border.subtle }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.naranja[50], alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={19} color={colors.naranja[600]} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Title style={{ fontSize: 15 }} numberOfLines={1}>{r.l}</Title>
                  <Body color={text.muted} style={{ fontSize: 12.5, marginTop: 1 }} numberOfLines={1}>{r.s}</Body>
                </View>
                <ChevronRight size={18} color={text.subtle} />
              </Pressable>
            );
          })}
        </View>

        {/* CERRAR SESIÓN — destructivo sobrio */}
        <Pressable
          onPress={() => clear()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.rojo[500] }}
        >
          <LogOut size={18} color={colors.rojo[500]} />
          <Title style={{ fontSize: 15 }} color={colors.rojo[500]}>Cerrar sesión</Title>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
