import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ClipboardList, ArrowRight, TrendingUp, ShoppingBag, CheckCircle2, UtensilsCrossed } from 'lucide-react-native';
import { Display, Heading, Title, Body, Label, Mono } from '../../../shared/ui/Type';
import { LogoSymbol } from '../../../shared/ui/LogoSymbol';
import { colors, text, surface, border, shadow, fonts } from '../../../shared/theme';
import { useOrdersStore, selectSemaforo, selectKpis } from '../../../features/orders/model/orders.store';
import { useSettingsStore } from '../../../features/admin/model/settings.store';
import type { AdminTabsParamList } from '../../../app/navigation/types';

const SEM = {
  verde: { color: colors.lima[500], bg: colors.lima[50], label: 'Tranquila' },
  amarillo: { color: colors.mango[400], bg: colors.mango[50], label: 'Concurrida' },
  rojo: { color: colors.rojo[500], bg: colors.rojo[50], label: 'Llena' },
} as const;

/** Dashboard del admin: semáforo de congestión en vivo (D-019) + KPIs del recreo. */
export function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AdminTabsParamList>>();
  const orders = useOrdersStore((s) => s.orders);
  const yellow = useSettingsStore((s) => s.semaforoYellow);
  const red = useSettingsStore((s) => s.semaforoRed);
  const branchName = useSettingsStore((s) => s.branchName);
  const sem = selectSemaforo(orders, yellow, red);
  const kpi = selectKpis(orders);
  const s = SEM[sem.level];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Encabezado */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Label>Cooperativa {branchName}</Label>
            <Display style={{ marginTop: 4 }}>Tablero{'\n'}del día</Display>
            <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 10 }} />
          </View>
          <LogoSymbol width={58} />
        </View>

        {/* SEMÁFORO (hero navy) */}
        <View style={{ marginTop: 22, backgroundColor: surface.ink, borderRadius: 22, padding: 20, ...shadow.floating }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Label color={text.onInkMuted}>Semáforo de congestión</Label>
            <Body color={text.onInkMuted} style={{ fontSize: 11.5, fontFamily: fonts.bodySemi }}>en vivo</Body>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 16 }}>
            {/* Luz */}
            <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: s.color }} />
            </View>
            <View style={{ flex: 1 }}>
              <Heading color={text.onInk} style={{ fontSize: 26, lineHeight: 30 }}>{s.label}</Heading>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 2 }}>
                <Mono color={s.color} style={{ fontFamily: fonts.monoBold, fontSize: 22 }}>{sem.count}</Mono>
                <Body color={text.onInkMuted} style={{ fontSize: 13 }}>pedidos en cola</Body>
              </View>
            </View>
          </View>

          {/* Escala de umbrales (D-019): solo se ILUMINA el nivel activo; los demás quedan apagados.
              El color lo decide el conteo en vivo de la cola (orders pending+preparing+ready). */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
            {[
              { level: 'verde' as const, c: colors.lima[500], t: `Verde · <${yellow}` },
              { level: 'amarillo' as const, c: colors.mango[400], t: `Amarillo · ${yellow}–${red}` },
              { level: 'rojo' as const, c: colors.rojo[500], t: `Rojo · >${red}` },
            ].map((u) => {
              const on = sem.level === u.level;
              return (
                <View
                  key={u.level}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 9, backgroundColor: on ? `${u.c}26` : surface.inkSoft, borderWidth: 1, borderColor: on ? u.c : 'transparent' }}
                >
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: on ? u.c : colors.gris[600] }} />
                  <Body color={on ? text.onInk : text.onInkMuted} style={{ fontSize: 10.5, fontFamily: on ? fonts.bodyBold : fonts.bodySemi }}>{u.t}</Body>
                </View>
              );
            })}
          </View>
        </View>

        {/* KPIs */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
          <KpiCard icon={<ShoppingBag size={18} color={colors.naranja[500]} />} value={`${kpi.pedidos}`} label="Pedidos hoy" />
          <KpiCard icon={<TrendingUp size={18} color={colors.lima[600]} />} value={`$${kpi.ingresos}`} label="Ingresos" />
          <KpiCard icon={<CheckCircle2 size={18} color={colors.azul[500]} />} value={`${kpi.entregados}`} label="Entregados" />
        </View>

        {/* Acceso rápido a la cola */}
        <Pressable
          onPress={() => navigation.navigate('Pedidos')}
          style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, ...shadow.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.naranja[50], alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={22} color={colors.naranja[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Title>Cola de pedidos</Title>
            <Body color={text.muted} style={{ fontSize: 12.5 }}>{sem.count} en proceso · marca los que estén listos</Body>
          </View>
          <ArrowRight size={20} color={text.muted} />
        </Pressable>

        {/* Acceso rápido al menú */}
        <Pressable
          onPress={() => navigation.navigate('Menu')}
          style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, ...shadow.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: colors.azul[50], alignItems: 'center', justifyContent: 'center' }}>
            <UtensilsCrossed size={22} color={colors.azul[600]} />
          </View>
          <View style={{ flex: 1 }}>
            <Title>Menú de la cooperativa</Title>
            <Body color={text.muted} style={{ fontSize: 12.5 }}>Productos, precios, stock y reoferta</Body>
          </View>
          <ArrowRight size={20} color={text.muted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: surface.card, borderRadius: 16, borderWidth: 1, borderColor: border.subtle, padding: 13, ...shadow.card }}>
      {icon}
      <Mono style={{ fontFamily: fonts.monoBold, fontSize: 19, marginTop: 8 }} color={text.heading}>{value}</Mono>
      <Label numberOfLines={1} style={{ marginTop: 3, fontSize: 9.5, letterSpacing: 0.6 }}>{label}</Label>
    </View>
  );
}
