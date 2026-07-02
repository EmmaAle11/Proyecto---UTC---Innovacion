import { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Store, Gauge, MapPin, Navigation } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../../app/navigation/types';
import { Heading, Title, Body, Label, Mono } from '../../../shared/ui/Type';
import { QtyStepper } from '../../../shared/ui/QtyStepper';
import { colors, text, surface, border, shadow, fonts } from '../../../shared/theme';
import { useSettingsStore } from '../../../features/admin/model/settings.store';
import { useSessionStore } from '../../../features/auth/model/session.store';
import { useBranchStore } from '../../../features/branch/model/branch.store';
import { useBranchLocation } from '../../../features/branch/lib/useBranchLocation';
import { BranchPicker } from '../../../widgets/branch/BranchPicker';
import {
  fetchCongestionThresholds,
  updateCongestionThresholds,
} from '../../../entities/order/api';

type Props = NativeStackScreenProps<AdminStackParamList, 'Personalizacion'>;

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Label style={{ marginBottom: 7 }}>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.gris[400]}
        style={{ height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: border.default, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.azul[700], backgroundColor: surface.card }}
      />
    </View>
  );
}

/** Editor de personalización del admin: cooperativa + umbrales del semáforo (en vivo, D-021). */
export function PersonalizacionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const s = useSettingsStore();
  const token = useSessionStore((st) => st.session?.accessToken);
  // §3.12: la cooperativa del admin se detecta por geolocalización (misma lista que el cliente).
  const branch = useBranchStore((st) => st.selected);
  const { status: locStatus, locate } = useBranchLocation(true);
  const [branchOpen, setBranchOpen] = useState(false);

  // G2: los umbrales viven server-side (app_settings). Los cargamos al abrir.
  useEffect(() => {
    fetchCongestionThresholds(token)
      .then((t) => s.set({ semaforoYellow: t.yellow, semaforoRed: t.red }))
      .catch(() => {}); // si falla la red, se queda con lo que hay en el store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Persiste el ajuste en el backend (así el semáforo del ALUMNO también cambia).
  const saveThresholds = (yellow: number, red: number) => {
    s.set({ semaforoYellow: yellow, semaforoRed: red });
    void updateCongestionThresholds(yellow, red, token).catch(() => {});
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, ...shadow.card }}
        >
          <ArrowLeft size={20} color={text.heading} />
        </Pressable>
        <View>
          <Label>Ajustes</Label>
          <Heading style={{ fontSize: 24, lineHeight: 28 }}>Personalización</Heading>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Cooperativa */}
        <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, ...shadow.card }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Store size={19} color={colors.azul[600]} />
            <Title style={{ fontSize: 16 }}>Cooperativa</Title>
          </View>
          <View style={{ marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: border.subtle, padding: 12, backgroundColor: surface.page }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color={colors.naranja[500]} />
              <Title style={{ fontSize: 15 }}>
                {branch?.name ?? (locStatus === 'loading' ? 'Detectando…' : 'Sin cooperativa')}
              </Title>
            </View>
            <Body color={text.muted} style={{ fontSize: 12.5, marginTop: 3 }}>
              {branch?.address ?? 'Detecta tu ubicación o elígela a mano. Los pedidos de esta cooperativa llegan a tu cola.'}
            </Body>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable onPress={() => void locate()} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: colors.azul[700] }}>
                <Navigation size={15} color="#fff" />
                <Body color="#fff" style={{ fontSize: 13, fontFamily: fonts.bodySemi }}>Usar mi ubicación</Body>
              </Pressable>
              <Pressable onPress={() => setBranchOpen(true)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 10, borderWidth: 1, borderColor: border.default }}>
                <Body color={text.heading} style={{ fontSize: 13, fontFamily: fonts.bodySemi }}>Elegir a mano</Body>
              </Pressable>
            </View>
          </View>
          <Field label="Horario de servicio" value={s.schedule} onChangeText={(v) => s.set({ schedule: v })} />
        </View>

        {/* Umbrales del semáforo */}
        <View style={{ marginTop: 16, backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, ...shadow.card }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Gauge size={19} color={colors.naranja[600]} />
            <Title style={{ fontSize: 16 }}>Umbrales del semáforo</Title>
          </View>
          <Body color={text.muted} style={{ fontSize: 12.5, marginTop: 6, lineHeight: 18 }}>
            Define cuántos pedidos en cola hacen cambiar el color. Se guarda en el servidor: lo ven al instante tu Dashboard y también el semáforo del alumno (§3.14).
          </Body>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.mango[400] }} />
              <Body style={{ fontSize: 14, fontFamily: fonts.bodySemi }}>Pasa a Amarillo en</Body>
            </View>
            <QtyStepper value={s.semaforoYellow} min={1} max={s.semaforoRed - 1} size="sm" onChange={(v) => saveThresholds(v, s.semaforoRed)} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.rojo[500] }} />
              <Body style={{ fontSize: 14, fontFamily: fonts.bodySemi }}>Pasa a Rojo al superar</Body>
            </View>
            <QtyStepper value={s.semaforoRed} min={s.semaforoYellow + 1} max={50} size="sm" onChange={(v) => saveThresholds(s.semaforoYellow, v)} />
          </View>

          {/* Vista previa */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
            {[
              { c: colors.lima[500], t: `Verde <${s.semaforoYellow}` },
              { c: colors.mango[400], t: `Amarillo ${s.semaforoYellow}–${s.semaforoRed}` },
              { c: colors.rojo[500], t: `Rojo >${s.semaforoRed}` },
            ].map((u) => (
              <View key={u.t} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.gris[100], borderRadius: 10, paddingVertical: 7, paddingHorizontal: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: u.c }} />
                <Mono color={text.muted} style={{ fontSize: 10 }}>{u.t}</Mono>
              </View>
            ))}
          </View>
        </View>

        <Body color={text.subtle} style={{ fontSize: 12, textAlign: 'center', marginTop: 18 }}>
          Los cambios se guardan solos.
        </Body>
      </ScrollView>

      <BranchPicker
        visible={branchOpen}
        onClose={() => setBranchOpen(false)}
        locating={locStatus === 'loading'}
        denied={locStatus === 'denied'}
        onUseLocation={() => void locate()}
      />
    </SafeAreaView>
  );
}
