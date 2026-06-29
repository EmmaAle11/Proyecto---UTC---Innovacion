import { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, ChevronRight, Check } from 'lucide-react-native';
import { Heading, Title, Body, Label, Mono } from '../../../shared/ui/Type';
import { Badge } from '../../../shared/ui/Badge';
import { Chip } from '../../../shared/ui/Chip';
import { colors, text, surface, border, shadow, fonts } from '../../../shared/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOrdersStore } from '../../../features/orders/model/orders.store';
import { useSessionStore } from '../../../features/auth/model/session.store';
import { ORDER_STATUS_META, QUEUE_STATUSES, type AdminOrder } from '../../../entities/order/admin-mock';
import type { OrderStatus } from '../../../entities/order/model/types';
import type { AdminStackParamList } from '../../../app/navigation/types';

/** Acción de avance de estado (transiciones BR-004), visual. */
const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: 'preparing', label: 'Aceptar' },
  preparing: { to: 'ready', label: 'Marcar listo' },
  ready: { to: 'picked_up', label: 'Entregar' },
};

type Filter = 'En cola' | 'Listos' | 'Todos' | 'Cerrados';
const FILTERS: Filter[] = ['En cola', 'Listos', 'Todos', 'Cerrados'];

function matches(f: Filter, o: AdminOrder): boolean {
  if (f === 'Todos') return true;
  if (f === 'En cola') return QUEUE_STATUSES.includes(o.status);
  if (f === 'Listos') return o.status === 'ready';
  return !QUEUE_STATUSES.includes(o.status); // Cerrados
}

/** Cola de pedidos del admin: filtra por estado y avanza el estado de cada pedido. */
export function QueueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const orders = useOrdersStore((s) => s.orders);
  const setStatus = useOrdersStore((s) => s.setStatus);
  const loadAll = useOrdersStore((s) => s.loadAll);
  const token = useSessionStore((s) => s.session?.accessToken);
  const [filter, setFilter] = useState<Filter>('En cola');
  useEffect(() => {
    void loadAll(token);
  }, [token, loadAll]);

  const onAdvance = (id: string, to: OrderStatus) => {
    void setStatus(id, to, token).catch((e: unknown) =>
      Alert.alert(
        'No se pudo actualizar',
        e instanceof Error ? e.message : 'Intenta de nuevo',
      ),
    );
  };

  const list = orders.filter((o) => matches(filter, o));
  const inQueue = orders.filter((o) => QUEUE_STATUSES.includes(o.status)).length;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Label>Recreo · hoy</Label>
          <Heading style={{ fontSize: 25, lineHeight: 29, marginTop: 2 }}>Cola de pedidos</Heading>
        </View>
        <View style={{ alignItems: 'center', backgroundColor: colors.naranja[50], borderRadius: 14, paddingHorizontal: 16, paddingVertical: 7 }}>
          <Mono style={{ fontFamily: fonts.monoBold, fontSize: 22 }} color={colors.naranja[600]}>{inQueue}</Mono>
          <Label style={{ fontSize: 9, marginTop: -1 }}>en cola</Label>
        </View>
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 10, paddingBottom: 12 }}>
        {FILTERS.map((f) => (
          <Chip key={f} selected={f === filter} onPress={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 2, paddingBottom: 28, gap: 14 }} showsVerticalScrollIndicator={false}>
        {list.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <Body color={text.muted}>Sin pedidos en este filtro.</Body>
          </View>
        ) : (
          list.map((o) => {
            const meta = ORDER_STATUS_META[o.status];
            const next = NEXT[o.status];
            const summary = o.items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(' · ');
            return (
              <Pressable key={o.id} onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })} style={{ backgroundColor: surface.card, borderRadius: 18, borderWidth: 1, borderColor: border.subtle, padding: 14, ...shadow.card }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Mono style={{ fontFamily: fonts.monoBold, fontSize: 16 }} color={text.heading}>{o.code}</Mono>
                    <Badge tone={meta.tone} dot>{meta.label}</Badge>
                  </View>
                  <Mono style={{ fontFamily: fonts.monoBold, fontSize: 15 }} color={text.heading}>{`$${o.total}`}</Mono>
                </View>

                <Title style={{ marginTop: 9, fontSize: 15 }}>{o.customer}</Title>
                <Body color={text.muted} style={{ fontSize: 12.5, marginTop: 2 }} numberOfLines={2}>{summary}</Body>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} color={text.subtle} />
                    <Body color={text.subtle} style={{ fontSize: 11.5 }}>{o.createdLabel} · {o.waitingMin} min</Body>
                  </View>
                  {next ? (
                    <Pressable
                      onPress={() => onAdvance(o.id, next.to)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: o.status === 'preparing' ? colors.lima[500] : colors.primary, paddingHorizontal: 14, height: 38, borderRadius: 12 }}
                    >
                      {o.status === 'preparing' ? <Check size={16} color="#fff" /> : null}
                      <Body color="#fff" style={{ fontSize: 13.5, fontFamily: fonts.bodyBold }}>{next.label}</Body>
                      {o.status !== 'preparing' ? <ChevronRight size={16} color="#fff" /> : null}
                    </Pressable>
                  ) : (
                    <Body color={text.subtle} style={{ fontSize: 12, fontFamily: fonts.bodySemi }}>Cerrado</Body>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
