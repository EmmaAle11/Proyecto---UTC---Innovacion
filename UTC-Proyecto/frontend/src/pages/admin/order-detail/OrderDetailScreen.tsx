import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Check, Clock } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Display, Title, Body, Label, Mono } from '../../../shared/ui/Type';
import { Badge } from '../../../shared/ui/Badge';
import { colors, text, surface, border, shadow, fonts } from '../../../shared/theme';
import { useOrdersStore } from '../../../features/orders/model/orders.store';
import { useSessionStore } from '../../../features/auth/model/session.store';
import {
  ORDER_STATUS_META,
  PAY_METHOD_LABEL,
  PAY_STATUS_LABEL,
  type AdminOrder,
} from '../../../entities/order/admin-types';
import type { OrderStatus } from '../../../entities/order/model/types';
import type { AdminStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'OrderDetail'>;

/** Acción de avance de estado (transiciones BR-004), visual — espeja QueueScreen. */
const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: 'preparing', label: 'Aceptar' },
  preparing: { to: 'ready', label: 'Marcar listo' },
  ready: { to: 'picked_up', label: 'Entregar' },
};

/** Color de la píldora de pago por estado: paid=lima, pending=neutral, failed=rojo, refunded=azul. */
const PAY_TONE: Record<AdminOrder['payStatus'], { bg: string; fg: string; dot: string }> = {
  paid: { bg: colors.lima[50], fg: colors.lima[600], dot: colors.lima[500] },
  pending: { bg: colors.gris[100], fg: colors.gris[700], dot: colors.gris[400] },
  failed: { bg: colors.rojo[50], fg: colors.rojo[600], dot: colors.rojo[500] },
  refunded: { bg: colors.azul[50], fg: colors.azul[600], dot: colors.azul[400] },
};

/** Detalle completo de un pedido del admin: cliente, ítems, total, pago, tiempos y transición de estado. */
export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const orders = useOrdersStore((s) => s.orders);
  const setStatus = useOrdersStore((s) => s.setStatus);
  const token = useSessionStore((s) => s.session?.accessToken);

  const onAdvance = (id: string, to: OrderStatus) => {
    void setStatus(id, to, token).catch((e: unknown) =>
      Alert.alert(
        'No se pudo actualizar',
        e instanceof Error ? e.message : 'Intenta de nuevo',
      ),
    );
  };

  const order = orders.find((o) => o.id === orderId);

  // Estado vacío: el pedido no existe (p. ej. id obsoleto).
  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: surface.page }}>
        <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, ...shadow.card }}
          >
            <ArrowLeft size={20} color={text.heading} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Label>Pedido</Label>
          <Heading404 />
        </View>
      </View>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const next = NEXT[order.status];
  const pay = PAY_TONE[order.payStatus];

  return (
    <View style={{ flex: 1, backgroundColor: surface.page }}>
      {/* Atrás */}
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 2 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, ...shadow.card }}
        >
          <ArrowLeft size={20} color={text.heading} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 28, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: código grande + estado + barrita naranja */}
        <View>
          <Label>Pedido</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <Mono style={{ fontFamily: fonts.monoBold, fontSize: 34 }} color={text.heading}>{order.code}</Mono>
            <Badge tone={meta.tone} dot>{meta.label}</Badge>
          </View>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 12 }} />
        </View>

        {/* Cliente */}
        <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, ...shadow.card }}>
          <Label>Cliente</Label>
          <Title style={{ marginTop: 8, fontSize: 17 }}>{order.customer}</Title>
          <Body color={text.muted} style={{ marginTop: 2 }}>{order.email}</Body>
        </View>

        {/* Ítems */}
        <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, ...shadow.card }}>
          <Label>Ítems</Label>
          <View style={{ marginTop: 10, gap: 10 }}>
            {order.items.map((it, idx) => (
              <View
                key={`${it.name}-${idx}`}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
              >
                <Title style={{ fontSize: 15, flexShrink: 1 }}>{it.name}</Title>
                <Mono style={{ fontFamily: fonts.monoBold, fontSize: 14 }} color={text.muted}>{`×${it.qty}`}</Mono>
              </View>
            ))}
          </View>

          <View style={{ height: 1, backgroundColor: border.subtle, marginTop: 14, marginBottom: 12 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Label>Total</Label>
            <Mono style={{ fontFamily: fonts.monoBold, fontSize: 26 }} color={text.heading}>{`$${order.total}`}</Mono>
          </View>
        </View>

        {/* Pago */}
        <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, ...shadow.card }}>
          <Label>Pago</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <Title style={{ fontSize: 15 }}>{PAY_METHOD_LABEL[order.payMethod]}</Title>
            <Badge tone="neutral" style={{ backgroundColor: pay.bg }} dot>
              <Body style={{ color: pay.fg, fontFamily: fonts.bodyBold, fontSize: 12 }}>{PAY_STATUS_LABEL[order.payStatus]}</Body>
            </Badge>
          </View>
        </View>

        {/* Tiempos */}
        <View style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 16, ...shadow.card }}>
          <Label>Tiempos</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color={text.subtle} />
              <Body color={text.muted}>Creado</Body>
            </View>
            <Mono style={{ fontFamily: fonts.monoBold, fontSize: 14 }} color={text.heading}>{order.createdLabel}</Mono>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <Body color={text.muted}>En cola</Body>
            <Mono style={{ fontFamily: fonts.monoBold, fontSize: 14 }} color={text.heading}>{`${order.waitingMin} min`}</Mono>
          </View>
        </View>

        {/* Transición de estado (BR-004) */}
        {next ? (
          <Pressable
            onPress={() => onAdvance(order.id, next.to)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: order.status === 'preparing' ? colors.lima[500] : colors.primary, height: 54, borderRadius: 16, ...shadow.card }}
          >
            {order.status === 'preparing' ? <Check size={18} color="#fff" /> : null}
            <Body color="#fff" style={{ fontSize: 16, fontFamily: fonts.bodyBold }}>{next.label}</Body>
            {order.status !== 'preparing' ? <ChevronRight size={18} color="#fff" /> : null}
          </Pressable>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Body color={text.subtle} style={{ fontFamily: fonts.bodySemi }}>Pedido cerrado · sin acciones</Body>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/** Mensaje del estado vacío (pedido inexistente). */
function Heading404() {
  return (
    <>
      <Display style={{ marginTop: 6, textAlign: 'center' }}>No encontrado</Display>
      <Body color={text.muted} style={{ marginTop: 8, textAlign: 'center' }}>
        Este pedido ya no está disponible.
      </Body>
    </>
  );
}
