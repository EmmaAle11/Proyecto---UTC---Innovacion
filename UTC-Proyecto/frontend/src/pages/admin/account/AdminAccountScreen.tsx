import { View, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../../app/navigation/types';
import {
  ShieldCheck, LogOut, Store, ChevronRight, Bell, Gauge, MapPin,
  Type as TypeIcon, Contrast, Activity, HelpCircle,
} from 'lucide-react-native';
import { Display, Heading, Title, Body, Label, Mono } from '../../../shared/ui/Type';
import { colors, text, surface, border, shadow, fonts } from '../../../shared/theme';
import { useSessionStore } from '../../../features/auth/model/session.store';
import { useSettingsStore } from '../../../features/admin/model/settings.store';

/** Fila de ajuste reutilizable (con rol de accesibilidad). */
function Row({ icon, label, sub, right, onPress, last }: {
  icon: ReactNode; label: string; sub?: string; right?: ReactNode; onPress?: () => void; last?: boolean;
}) {
  const rowStyle = { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: border.subtle } as const;
  const inner = (
    <>
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colors.gris[100], alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Title style={{ fontSize: 14.5 }}>{label}</Title>
        {sub ? <Body color={text.muted} style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>{sub}</Body> : null}
      </View>
      {right}
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={rowStyle}>
        {inner}
      </Pressable>
    );
  }
  return (
    <View accessibilityLabel={label} style={rowStyle}>
      {inner}
    </View>
  );
}

/** Cuenta del administrador: identidad, personalización (funcional), accesibilidad y cerrar sesión. */
export function AdminAccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const session = useSessionStore((s) => s.session);
  const clear = useSessionStore((s) => s.clear);
  const settings = useSettingsStore();
  const email = session?.email ?? 'admin@picksazon.app';
  const initials = email.slice(0, 2).toUpperCase();
  const goPers = () => navigation.navigate('Personalizacion');

  const track = { false: colors.gris[200], true: colors.naranja[300] };
  const thumb = (on: boolean) => (on ? colors.naranja[500] : colors.gris[100]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Label>Cooperativa {settings.branchName}</Label>
        <Display style={{ marginTop: 4 }}>Tu cuenta</Display>
        <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 10 }} />

        {/* Identidad (navy) */}
        <View style={{ marginTop: 22, backgroundColor: surface.ink, borderRadius: 22, padding: 20, ...shadow.floating }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: colors.naranja[500], alignItems: 'center', justifyContent: 'center' }}>
              <Mono color="#fff" style={{ fontFamily: fonts.monoBold, fontSize: 22 }}>{initials}</Mono>
            </View>
            <View style={{ flex: 1 }}>
              <Heading color={text.onInk} style={{ fontSize: 21, lineHeight: 25 }}>Administrador</Heading>
              <Body color={text.onInkMuted} style={{ fontSize: 13 }} numberOfLines={1}>{email}</Body>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, alignSelf: 'flex-start', backgroundColor: surface.inkSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
            <ShieldCheck size={15} color={colors.lima[500]} />
            <Body color={text.onInk} style={{ fontSize: 12, fontFamily: fonts.bodySemi }}>Acceso administrador · MFA activa</Body>
          </View>
        </View>

        {/* PERSONALIZACIÓN (funcional → editor) */}
        <Label style={{ marginTop: 26, marginBottom: 10 }}>Personalización</Label>
        <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, paddingHorizontal: 16, ...shadow.card }}>
          <Row icon={<Store size={19} color={colors.azul[600]} />} label="Sucursal" sub={`${settings.branchName} · ${settings.address}`} right={<ChevronRight size={18} color={text.subtle} />} onPress={goPers} />
          <Row
            icon={<Gauge size={19} color={colors.naranja[600]} />}
            label="Umbrales del semáforo"
            sub="Cuándo cambia de color la cola (D-019)"
            right={<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Mono color={colors.mango[600]} style={{ fontFamily: fonts.monoBold, fontSize: 14 }}>{settings.semaforoYellow}</Mono><Mono color={colors.rojo[500]} style={{ fontFamily: fonts.monoBold, fontSize: 14 }}>{settings.semaforoRed}</Mono><ChevronRight size={18} color={text.subtle} /></View>}
            onPress={goPers}
          />
          <Row icon={<MapPin size={19} color={colors.lima[600]} />} label="Horario de servicio" sub={settings.schedule} right={<ChevronRight size={18} color={text.subtle} />} onPress={goPers} last />
        </View>

        {/* ACCESIBILIDAD */}
        <Label style={{ marginTop: 22, marginBottom: 10 }}>Accesibilidad</Label>
        <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, paddingHorizontal: 16, ...shadow.card }}>
          <Row icon={<TypeIcon size={19} color={colors.azul[600]} />} label="Texto grande" sub="Aumenta el tamaño de la letra"
            right={<Switch value={settings.largeText} onValueChange={(v) => settings.set({ largeText: v })} trackColor={track} thumbColor={thumb(settings.largeText)} accessibilityLabel="Texto grande" />} />
          <Row icon={<Contrast size={19} color={colors.azul[600]} />} label="Alto contraste" sub="Más contraste para leer mejor"
            right={<Switch value={settings.highContrast} onValueChange={(v) => settings.set({ highContrast: v })} trackColor={track} thumbColor={thumb(settings.highContrast)} accessibilityLabel="Alto contraste" />} />
          <Row icon={<Activity size={19} color={colors.azul[600]} />} label="Reducir movimiento" sub="Menos animaciones"
            right={<Switch value={settings.reduceMotion} onValueChange={(v) => settings.set({ reduceMotion: v })} trackColor={track} thumbColor={thumb(settings.reduceMotion)} accessibilityLabel="Reducir movimiento" />} last />
        </View>

        {/* AVISOS + AYUDA */}
        <Label style={{ marginTop: 22, marginBottom: 10 }}>Avisos y soporte</Label>
        <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, paddingHorizontal: 16, ...shadow.card }}>
          <Row icon={<Bell size={19} color={colors.naranja[600]} />} label="Avisos de pedidos" sub="Cuando entra o cambia un pedido"
            right={<Switch value={settings.notifyOrders} onValueChange={(v) => settings.set({ notifyOrders: v })} trackColor={track} thumbColor={thumb(settings.notifyOrders)} accessibilityLabel="Avisos de pedidos" />} />
          <Row icon={<HelpCircle size={19} color={colors.azul[600]} />} label="Ayuda y soporte" right={<ChevronRight size={18} color={text.subtle} />} onPress={() => {}} last />
        </View>

        {/* Cerrar sesión */}
        <Pressable
          onPress={clear}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          style={{ marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: colors.rojo[500], backgroundColor: colors.rojo[50] }}
        >
          <LogOut size={19} color={colors.rojo[600]} />
          <Title color={colors.rojo[600]} style={{ fontSize: 15 }}>Cerrar sesión</Title>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
