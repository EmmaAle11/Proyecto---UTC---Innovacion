import { useEffect } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt, ArrowRight, Check, CircleSlash } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { Badge } from '../../shared/ui/Badge';
import { OrderTracker } from '../../shared/ui/OrderTracker';
import { Display, Title, Body, Label, Mono } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow, fonts } from '../../shared/theme';
import { useOrdersStore, trackerStep, TERMINAL_STATUSES } from '../../features/orders/model/orders.store';
import { useSessionStore } from '../../features/auth/model/session.store';
import { ORDER_STATUS_META, type AdminOrder } from '../../entities/order/admin-mock';

/**
 * Pestaña Pedidos del cliente: lee SUS pedidos del store compartido (los mismos
 * que ve el admin). Activo = en curso (tracker en vivo) · Historial = cerrados.
 */
export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const token = useSessionStore((s) => s.session?.accessToken);
  const orders = useOrdersStore((s) => s.orders);
  const loaded = useOrdersStore((s) => s.loaded);
  const setActiveOrder = useOrdersStore((s) => s.setActiveOrder);
  const loadMine = useOrdersStore((s) => s.loadMine);
  const loading = useOrdersStore((s) => s.loading);
  const error = useOrdersStore((s) => s.error);
  useEffect(() => {
    void loadMine(token);
  }, [token, loadMine]);

  // El backend ya entrega SOLO mis pedidos (BR-014: aislado por el JWT); los mostramos
  // una vez cargados (evita el flash del mock compartido antes del fetch).
  const mine = loaded ? orders : [];
  const active = mine.filter((o) => !TERMINAL_STATUSES.includes(o.status));
  const history = mine.filter((o) => TERMINAL_STATUSES.includes(o.status));

  const openTracking = (id: string) => {
    setActiveOrder(id);
    navigation.navigate('Tracking');
  };
  const summary = (o: AdminOrder) => o.items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(' · ');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 14, paddingBottom: 22 }}>
          <Display>Tus pedidos</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 10 }} />
        </View>

        {loading && mine.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 70 }}>
            <ActivityIndicator size="large" color={colors.naranja[500]} />
          </View>
        ) : mine.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 70 }}>
            <Receipt size={46} color={colors.gris[300]} />
            <Body color={text.muted} style={{ marginTop: 14, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              {error
                ? 'No se pudieron cargar tus pedidos.\nRevisa tu conexión e inténtalo de nuevo.'
                : 'Aún no tienes pedidos.\nTu próximo antojo aparecerá aquí.'}
            </Body>
          </View>
        ) : null}

        {/* ACTIVO */}
        {active.length > 0 ? (
          <>
            <Label style={{ marginBottom: 11 }}>Activo</Label>
            <View style={{ gap: 12, marginBottom: 24 }}>
              {active.map((o) => {
                const meta = ORDER_STATUS_META[o.status];
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => openTracking(o.id)}
                    style={{ backgroundColor: surface.card, borderWidth: 1.5, borderColor: colors.naranja[200], borderRadius: 18, padding: 16, ...shadow.card }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <Mono style={{ fontFamily: fonts.monoBold, fontSize: 16 }} color={text.heading}>{`#${o.code}`}</Mono>
                      <Badge tone={meta.tone} dot>{meta.label}</Badge>
                    </View>
                    <OrderTracker current={trackerStep(o.status)} note={o.status === 'ready' || o.status === 'ready_later' ? 'Listo' : undefined} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16 }}>
                      <Body color={colors.naranja[600]} style={{ fontSize: 13, fontFamily: fonts.bodyBold }}>Ver seguimiento</Body>
                      <ArrowRight size={15} color={colors.naranja[600]} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {/* HISTORIAL */}
        {history.length > 0 ? (
          <>
            <Label style={{ marginBottom: 12 }}>Historial</Label>
            <View style={{ gap: 10 }}>
              {history.map((o) => {
                const ok = o.status === 'picked_up';
                return (
                  <View
                    key={o.id}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, borderRadius: 16, padding: 12 }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: ok ? colors.lima[50] : colors.gris[100], alignItems: 'center', justifyContent: 'center' }}>
                      {ok ? <Check size={19} color={colors.lima[600]} /> : <CircleSlash size={19} color={colors.gris[500]} />}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Title style={{ fontSize: 14.5 }} numberOfLines={1}>{summary(o)}</Title>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Mono style={{ fontSize: 12 }} color={text.muted}>{`#${o.code}`}</Mono>
                        <Body color={text.muted} style={{ fontSize: 12 }}>{`· ${o.createdLabel} · ${ORDER_STATUS_META[o.status].label}`}</Body>
                      </View>
                    </View>
                    <Mono style={{ fontFamily: fonts.monoBold, fontSize: 15 }} color={text.heading}>{`$${o.total}`}</Mono>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
