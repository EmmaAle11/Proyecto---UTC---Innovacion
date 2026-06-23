import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, Bell, ShieldCheck, CircleHelp, ChevronRight, LogOut } from 'lucide-react-native';
import { colors, text, border, surface } from '../../shared/theme';
import { useSessionStore } from '../../features/auth/model/session.store';

const ROWS = [
  { i: Wallet, l: 'Métodos de pago', s: 'Mercado Pago, PayPal, TDC/TDD, efectivo' },
  { i: Bell, l: 'Notificaciones', s: 'Avisos de "listo para recoger"' },
  { i: ShieldCheck, l: 'Cuenta y seguridad', s: 'Sesión con tu correo @utc.edu.mx' },
  { i: CircleHelp, l: 'Ayuda', s: 'Sobre la cooperativa y el Pick Up' },
] as const;

/** Pestaña Perfil: tarjeta de cuenta + ajustes + cerrar sesión (vuelve a Welcome). */
export function ProfileScreen() {
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
        <Text style={{ fontSize: 24, fontWeight: '800', color: text.heading, marginBottom: 16 }}>Perfil</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: colors.azul[700], borderRadius: 18, marginBottom: 18 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.naranja[500], alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 20 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{name}</Text>
            <Text style={{ color: colors.azul[200], fontSize: 13 }} numberOfLines={1}>{email || 'cuenta@utc.edu.mx'}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: border.subtle, borderRadius: 18, overflow: 'hidden', marginBottom: 18 }}>
          {ROWS.map((r, i) => {
            const Icon = r.i;
            return (
              <View key={r.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: border.subtle }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colors.naranja[50], alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={19} color={colors.naranja[600]} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14.5, color: text.heading }}>{r.l}</Text>
                  <Text style={{ fontSize: 12, color: text.muted }}>{r.s}</Text>
                </View>
                <ChevronRight size={18} color={colors.gris[400]} />
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => clear()}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.rojo[500] }}
        >
          <LogOut size={18} color={colors.rojo[500]} />
          <Text style={{ color: colors.rojo[500], fontWeight: '700', fontSize: 15 }}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
