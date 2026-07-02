import { useState } from 'react';
import { View, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Wallet,
  Bell,
  ChevronRight,
  ChevronDown,
  LogOut,
  Type as TypeIcon,
  Contrast,
  Activity,
  CircleHelp,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Display, Heading, Title, Body, Label, Mono } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow, fonts } from '../../shared/theme';
import { useSessionStore } from '../../features/auth/model/session.store';
import { useClientSettingsStore } from '../../features/profile/model/settings.store';
import { useA11yStore } from '../../shared/a11y/a11y.store';
import { requestNotificationPermission } from '../../shared/notifications/notify';
import type { MainStackParamList } from '../../app/navigation/types';

/** Fila de ajuste reutilizable (acción a la derecha: chevron o switch). */
function Row({
  icon,
  label,
  sub,
  right,
  onPress,
  last,
}: {
  icon: ReactNode;
  label: string;
  sub?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const style = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    borderTopWidth: 0,
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: border.subtle,
  } as const;
  const inner = (
    <>
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colors.naranja[50], alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Title style={{ fontSize: 14.5 }} numberOfLines={1}>{label}</Title>
        {sub ? <Body color={text.muted} style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>{sub}</Body> : null}
      </View>
      {right}
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={style}>
      {inner}
    </Pressable>
  ) : (
    <View accessibilityLabel={label} style={style}>{inner}</View>
  );
}

/** Pestaña Perfil: cuenta + cartera + accesibilidad (funcional) + ayuda + cerrar sesión. */
export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const session = useSessionStore((s) => s.session);
  const clear = useSessionStore((s) => s.clear);
  const settings = useClientSettingsStore();
  const a11y = useA11yStore();
  const [helpOpen, setHelpOpen] = useState(false);

  const email = session?.email ?? '';
  const localPart = email.split('@')[0] ?? '';
  const words = localPart.split(/[._-]+/).filter(Boolean);
  const name = words.slice(0, 2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Alumno UTC';
  const initials = ((words[0]?.[0] ?? 'U') + (words[1]?.[0] ?? '')).toUpperCase();

  const track = { false: colors.gris[200], true: colors.naranja[300] };
  const thumb = (on: boolean) => (on ? colors.naranja[500] : colors.gris[100]);

  // Al ACTIVAR avisos pide el permiso del SO (en web debe salir del gesto del tap);
  // sólo queda en ON si el permiso fue concedido. Al apagar, no pide nada.
  const onToggleNotify = (v: boolean) => {
    if (!v) {
      settings.set({ notifyReady: false });
      return;
    }
    void requestNotificationPermission().then((ok) => {
      settings.set({ notifyReady: ok });
      if (!ok) {
        Alert.alert(
          'Avisos no activados',
          'Tu navegador o dispositivo no concedió el permiso. Actívalo en los ajustes del sistema para recibir avisos de tu pedido.',
        );
      }
    });
  };

  const card = { backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, paddingHorizontal: 16, ...shadow.card } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 4, paddingBottom: 18 }}>
          <Display>Tu cuenta</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 10 }} />
        </View>

        {/* Identidad (navy) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: surface.ink, borderRadius: 20, marginBottom: 18, ...shadow.card }}>
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.naranja[500], alignItems: 'center', justifyContent: 'center' }}>
            <Mono style={{ fontFamily: fonts.monoBold, fontSize: 21 }} color={text.onInk}>{initials}</Mono>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Heading style={{ fontSize: 20, lineHeight: 24 }} color={text.onInk} numberOfLines={1}>{name}</Heading>
            <Body style={{ fontSize: 13 }} color={text.onInkMuted} numberOfLines={1}>{email || 'cuenta@edu.utc.mx'}</Body>
          </View>
        </View>

        {/* Pago */}
        <Label style={{ marginBottom: 10 }}>Pago</Label>
        <View style={[card, { marginBottom: 18 }]}>
          <Row
            icon={<Wallet size={19} color={colors.naranja[600]} />}
            label="Mi cartera"
            sub="Tarjetas y efectivo · agregar o quitar"
            right={<ChevronRight size={18} color={text.subtle} />}
            onPress={() => navigation.navigate('Wallet')}
            last
          />
        </View>

        {/* Accesibilidad (funcional) */}
        <Label style={{ marginBottom: 10 }}>Accesibilidad</Label>
        <View style={[card, { marginBottom: 18 }]}>
          <Row icon={<TypeIcon size={19} color={colors.azul[600]} />} label="Texto grande" sub="Aumenta el tamaño de la letra"
            right={<Switch value={a11y.largeText} onValueChange={(v) => a11y.set({ largeText: v })} trackColor={track} thumbColor={thumb(a11y.largeText)} accessibilityLabel="Texto grande" />} />
          <Row icon={<Contrast size={19} color={colors.azul[600]} />} label="Alto contraste" sub="Más contraste para leer mejor"
            right={<Switch value={a11y.highContrast} onValueChange={(v) => a11y.set({ highContrast: v })} trackColor={track} thumbColor={thumb(a11y.highContrast)} accessibilityLabel="Alto contraste" />} />
          <Row icon={<Activity size={19} color={colors.azul[600]} />} label="Reducir movimiento" sub="Menos animaciones"
            right={<Switch value={a11y.reduceMotion} onValueChange={(v) => a11y.set({ reduceMotion: v })} trackColor={track} thumbColor={thumb(a11y.reduceMotion)} accessibilityLabel="Reducir movimiento" />} last />
        </View>

        {/* Avisos + Ayuda */}
        <Label style={{ marginBottom: 10 }}>Avisos y ayuda</Label>
        <View style={[card, { marginBottom: 18 }]}>
          <Row icon={<Bell size={19} color={colors.naranja[600]} />} label="Avisos de pedido" sub="Aceptado, listo y cambios de tu pedido"
            right={<Switch value={settings.notifyReady} onValueChange={onToggleNotify} trackColor={track} thumbColor={thumb(settings.notifyReady)} accessibilityLabel="Avisos de pedido" />} />
          <Row
            icon={<CircleHelp size={19} color={colors.azul[600]} />}
            label="Ayuda"
            sub="Cómo funciona el Pick Up"
            right={helpOpen ? <ChevronDown size={18} color={text.subtle} /> : <ChevronRight size={18} color={text.subtle} />}
            onPress={() => setHelpOpen((v) => !v)}
            last
          />
          {helpOpen ? (
            <View style={{ paddingBottom: 14, paddingLeft: 51, paddingRight: 4 }}>
              <Body color={text.muted} style={{ fontSize: 12.5, lineHeight: 19 }}>
                Arma tu pedido en el menú, paga (o elige efectivo al recoger) y te avisamos con tu turno cuando esté listo. Recoges en la cooperativa mostrando tu código — sin filas.
              </Body>
            </View>
          ) : null}
        </View>

        {/* Cerrar sesión */}
        <Pressable
          onPress={() => clear()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.rojo[500], backgroundColor: colors.rojo[50] }}
        >
          <LogOut size={18} color={colors.rojo[500]} />
          <Title style={{ fontSize: 15 }} color={colors.rojo[500]}>Cerrar sesión</Title>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
