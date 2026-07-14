import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Text, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  MapPin,
  Wallet,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Banknote,
  ArrowRight,
  Minus,
  Plus,
  Clock,
  Zap,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { Media } from '../../shared/ui/Media';
import { Display, Title, Body, Label, Mono } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow, fonts } from '../../shared/theme';
import { productImage } from '../../entities/product/images';
import { productIcon } from '../../entities/product/icons';
import { priceToPay } from '../../entities/product/model/types';
import { useCartStore, selectTotal } from '../../features/cart/model/cart.store';
import { useOrdersStore, type Order } from '../../features/orders/model/orders.store';
import { useSessionStore } from '../../features/auth/model/session.store';
import { useBranchStore } from '../../features/branch/model/branch.store';
import { useWalletStore } from '../../features/wallet/model/wallet.store';
import { CardForm } from '../../features/wallet/ui/CardForm';
import { fetchCongestion, type ApiCongestion } from '../../entities/order/api';
import { ApiError } from '../../shared/api/client';
import type { PaymentMethod } from '../../entities/order/model/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Cart'>;

// Semáforo discreto en el checkout (D-019): el cliente decide si avanza con el pago.
const SEM_META = {
  verde: { dot: colors.lima[500], label: 'Cooperativa tranquila', sub: 'buen momento para pedir' },
  amarillo: { dot: colors.mango[400], label: 'Cooperativa concurrida', sub: 'puede tardar un poco' },
  rojo: { dot: colors.rojo[500], label: 'Cooperativa llena', sub: 'quizá conviene esperar' },
} as const;

// Métodos de pago (BR-009). Selector solo VISUAL — pagos diferidos (D-006).
const METHODS = [
  { k: 'mercado_pago', l: 'Mercado Pago', s: 'Saldo o tarjeta guardada', Icon: Wallet },
  { k: 'paypal', l: 'PayPal', s: 'Tu cuenta PayPal', Icon: CircleDollarSign },
  { k: 'tdc', l: 'Tarjeta de crédito (TDC)', s: 'Visa · Mastercard · Amex', Icon: CreditCard },
  { k: 'tdd', l: 'Tarjeta de débito (TDD)', s: 'Débito de tu banco', Icon: Landmark },
  { k: 'efectivo', l: 'Efectivo al recoger', s: 'Paga en el mostrador', Icon: Banknote },
] as const;

// Degradado de marca para botones de acción (estilo "premium" del favorito, en naranja UTC).
const BTN_GRADIENT: [string, string, string] = [
  colors.naranja[400],
  colors.naranja[500],
  colors.naranja[600],
];

/** Título de tarjeta estilo "recibo": etiqueta editorial + línea inferior. */
function CardTitle({ children }: { children: string }) {
  return (
    <View
      style={{
        height: 42,
        justifyContent: 'center',
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: border.subtle,
      }}
    >
      <Label>{children}</Label>
    </View>
  );
}

/** Píldora del selector de recogida (spec #4): resaltada en naranja si está activa. */
function schedulePill(on: boolean) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: on ? colors.naranja[50] : colors.gris[100],
    borderWidth: on ? 1.5 : 1,
    borderColor: on ? colors.naranja[500] : border.subtle,
  };
}

/** Stepper de cantidad en píldora bordeada (− N +), inspirado en el favorito. */
function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const btn = (label: 'minus' | 'plus', target: number, off: boolean) => (
    <Pressable
      onPress={off ? undefined : () => onChange(target)}
      disabled={off}
      style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}
    >
      {label === 'minus' ? (
        <Minus size={15} color={off ? text.subtle : colors.azul[700]} />
      ) : (
        <Plus size={15} color={off ? text.subtle : colors.azul[700]} />
      )}
    </Pressable>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: border.default,
        borderRadius: 9,
        backgroundColor: surface.card,
      }}
    >
      {btn('minus', value - 1, value <= min)}
      <Text
        style={{
          minWidth: 24,
          textAlign: 'center',
          fontFamily: fonts.monoBold,
          fontSize: 15,
          color: text.heading,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      {btn('plus', value + 1, value >= max)}
    </View>
  );
}

/** Carrito / checkout (estética "recibo apilado"): productos, método de pago y resumen. */
export function CartScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const selectedBranch = useBranchStore((s) => s.selected); // sucursal de recogida (§3.12)
  const token = useSessionStore((s) => s.session?.accessToken);
  const email = useSessionStore((s) => s.session?.email ?? 'demo@edu.utc.mx');
  const total = selectTotal(items);
  const [pay, setPay] = useState<string>('mercado_pago');
  const [saving, setSaving] = useState(false);
  // C2: tarjeta seleccionada + formulario de alta (solo para métodos con tarjeta).
  const cards = useWalletStore((s) => s.cards);
  const addCard = useWalletStore((s) => s.add);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const isCardMethod = pay === 'tdc' || pay === 'tdd';
  const kindCards = cards.filter((c) => c.kind === pay);
  const [congestion, setCongestion] = useState<ApiCongestion | null>(null);
  useEffect(() => {
    let alive = true;
    fetchCongestion(token)
      .then((c) => {
        if (alive) setCongestion(c);
      })
      .catch(() => {
        /* sin semáforo si no hay backend; no estorba el checkout */
      });
    return () => {
      alive = false;
    };
  }, [token]);
  const maxPrep = items.reduce(
    (m, it) => Math.max(m, Math.round(it.product.basePrepTimeSeconds / 60)),
    0,
  );
  const selected = METHODS.find((m) => m.k === pay) ?? METHODS[0];

  // Recogida programada (spec #4): null = lo antes posible. Franjas ≥30 min, hoy.
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const slots = useMemo(() => {
    const now = new Date();
    return [30, 45, 60, 90]
      .map((min) => {
        const d = new Date(now.getTime() + min * 60000);
        return {
          iso: d.toISOString(),
          label: `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`,
          sameDay: d.getDate() === now.getDate(),
        };
      })
      .filter((s) => s.sameDay);
  }, []);

  /** Pedido local de respaldo (solo demo en dev, si el backend no responde). */
  const buildDemoOrder = (): Order => {
    const now = new Date();
    const hh = `${now.getHours()}`.padStart(2, '0');
    const mm = `${now.getMinutes()}`.padStart(2, '0');
    return {
      id: `demo-${now.getTime()}`,
      code: `U-${String(now.getTime()).slice(-5)}`,
      customer: 'Tú (demo)',
      email,
      status: 'pending',
      total,
      items: items.map((it) => ({ name: it.product.name, qty: it.qty })),
      createdLabel: `${hh}:${mm}`,
      waitingMin: 0,
      payMethod: pay as PaymentMethod,
      payStatus: pay === 'efectivo' ? 'pending' : 'paid',
      scheduledFor,
      startBy: scheduledFor
        ? new Date(new Date(scheduledFor).getTime() - maxPrep * 60000).toISOString()
        : null,
    };
  };

  const onPay = async () => {
    if (saving || items.length === 0) return;
    // §3.12: no se pide sin cooperativa (se detecta por geo o se elige a mano).
    if (!selectedBranch) {
      Alert.alert('Falta la cooperativa', 'Detecta o elige tu cooperativa de recogida para continuar.');
      return;
    }
    // C2: con tarjeta hace falta una tarjeta elegida (o agregada). El cobro lo
    // "aprueba" el backend (gateway simulado + circuit breaker).
    if (isCardMethod && !kindCards.some((c) => c.id === selectedCardId)) {
      Alert.alert('Falta la tarjeta', 'Elige una tarjeta guardada o agrega una para pagar.');
      return;
    }
    setSaving(true);
    try {
      // El backend snapshotea precio/total (BR-015) y crea orden+pago; abre el Seguimiento.
      await placeOrder(
        {
          items: items.map((it) => ({ productId: it.product.id, quantity: it.qty })),
          payMethod: pay as PaymentMethod,
          ...(scheduledFor ? { scheduledFor } : {}),
          branchId: selectedBranch.id,
          branchName: selectedBranch.name,
        },
        token,
        buildDemoOrder,
      );
      clear();
      navigation.replace('Tracking');
    } catch (e) {
      // D-052: 409 = se agotó mientras el cliente pedía (la reserva no alcanzó). Título accionable.
      const soldOut = e instanceof ApiError && e.status === 409;
      Alert.alert(
        soldOut ? 'Se agotó mientras pedías' : 'No se pudo enviar el pedido',
        e instanceof Error ? e.message : 'Intenta de nuevo',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      {/* Header editorial */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: border.subtle, backgroundColor: surface.card, alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color={colors.azul[700]} />
        </Pressable>
        <View>
          <Display style={{ fontSize: 28, lineHeight: 32 }}>Tu pedido</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 8 }} />
        </View>
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Body color={text.muted} style={{ fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
            Tu carrito está vacío.{'\n'}Vuelve al menú y arma tu antojo.
          </Body>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
          {/* Semáforo discreto (D-019): ¿conviene pedir ahora? */}
          {congestion ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 12, ...shadow.card }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: SEM_META[congestion.level].dot }} />
              <Body style={{ fontSize: 12, fontFamily: fonts.bodySemi }} color={text.heading}>{SEM_META[congestion.level].label}</Body>
              <Body color={text.muted} style={{ fontSize: 11.5 }}>· {SEM_META[congestion.level].sub}</Body>
            </View>
          ) : null}

          {/* ── Tarjeta 1: Productos ── */}
          <View
            style={{
              backgroundColor: surface.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              marginBottom: 5,
              overflow: 'hidden',
              ...shadow.card,
            }}
          >
            <CardTitle>Productos</CardTitle>
            <View style={{ padding: 12, gap: 12 }}>
              {items.map((it) => {
                const Icon = productIcon(it.product.icon);
                return (
                  <View key={it.product.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Media height={52} radius={12} style={{ width: 52 }} source={productImage(it.product)} icon={<Icon size={22} color={colors.azul[300]} />} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Title style={{ fontSize: 14 }} numberOfLines={1}>{it.product.name}</Title>
                      <Body color={text.muted} style={{ fontSize: 11, marginTop: 2 }} numberOfLines={1}>{it.product.category}</Body>
                    </View>
                    <Stepper value={it.qty} min={0} max={10} onChange={(v) => setQty(it.product.id, v)} />
                    <Mono style={{ fontFamily: fonts.monoBold, fontSize: 13.5, minWidth: 46, textAlign: 'right' }} color={text.heading}>{`$${priceToPay(it.product)}`}</Mono>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Tarjeta 2: Método de pago (píldoras compactas) ── */}
          <View style={{ backgroundColor: surface.card, borderRadius: 8, marginBottom: 5, overflow: 'hidden', ...shadow.card }}>
            <CardTitle>Método de pago</CardTitle>
            <View style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {METHODS.map((m) => {
                  const on = pay === m.k;
                  const Icon = m.Icon;
                  return (
                    <Pressable
                      key={m.k}
                      onPress={() => setPay(m.k)}
                      style={{
                        flex: 1,
                        height: 46,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? colors.naranja[50] : colors.gris[100],
                        borderWidth: on ? 1.5 : 1,
                        borderColor: on ? colors.naranja[500] : border.subtle,
                      }}
                    >
                      <Icon size={19} color={on ? colors.naranja[600] : colors.azul[400]} />
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ marginTop: 11 }}>
                <Title style={{ fontSize: 14 }}>{selected.l}</Title>
                <Body color={text.muted} style={{ fontSize: 11.5, marginTop: 1 }}>{selected.s}</Body>
              </View>

              {/* C2: con tarjeta, elige una guardada o agrega. Sin tarjeta no se paga. */}
              {isCardMethod ? (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {kindCards.map((c) => {
                    const on = selectedCardId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setSelectedCardId(c.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: on ? 1.5 : 1, borderColor: on ? colors.azul[600] : border.subtle, backgroundColor: on ? colors.azul[50] : surface.card }}
                      >
                        <Body style={{ fontSize: 13, fontFamily: fonts.bodySemi }} color={text.heading}>
                          {c.brand} ···· {c.last4}
                        </Body>
                        <Body color={text.muted} style={{ fontSize: 12 }}>
                          {c.expMonth ? `${String(c.expMonth).padStart(2, '0')}/${String(c.expYear).padStart(2, '0')}` : ''}
                        </Body>
                      </Pressable>
                    );
                  })}
                  <Pressable onPress={() => setCardFormOpen(true)} style={{ alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.azul[300] }}>
                    <Body color={colors.azul[600]} style={{ fontSize: 13, fontFamily: fonts.bodySemi }}>+ Agregar tarjeta</Body>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Tarjeta: ¿Cuándo la recoges? (pedido programado, spec #4) ── */}
          <View style={{ backgroundColor: surface.card, borderRadius: 8, marginBottom: 5, overflow: 'hidden', ...shadow.card }}>
            <CardTitle>¿Cuándo la recoges?</CardTitle>
            <View style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Pressable onPress={() => setScheduledFor(null)} style={schedulePill(scheduledFor === null)}>
                  <Zap size={15} color={scheduledFor === null ? colors.naranja[600] : colors.azul[400]} />
                  <Body style={{ fontSize: 12.5, fontFamily: fonts.bodySemi }} color={scheduledFor === null ? colors.naranja[600] : text.heading}>Lo antes posible</Body>
                </Pressable>
                {slots.map((s) => {
                  const on = scheduledFor === s.iso;
                  return (
                    <Pressable key={s.iso} onPress={() => setScheduledFor(s.iso)} style={schedulePill(on)}>
                      <Clock size={15} color={on ? colors.naranja[600] : colors.azul[400]} />
                      <Body style={{ fontSize: 12.5, fontFamily: fonts.bodySemi }} color={on ? colors.naranja[600] : text.heading}>{s.label}</Body>
                    </Pressable>
                  );
                })}
              </View>
              <Body color={text.muted} style={{ fontSize: 11.5, marginTop: 10 }}>
                {scheduledFor
                  ? `Programado para las ${slots.find((s) => s.iso === scheduledFor)?.label ?? ''}. Lo preparamos a tiempo y te avisamos.`
                  : 'Se prepara en cuanto la cocina lo acepte (mínimo 30 min si programas).'}
              </Body>
            </View>
          </View>

          {/* ── Tarjeta 3: Resumen + recogida + checkout ── */}
          <View
            style={{
              backgroundColor: surface.card,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
              overflow: 'hidden',
              ...shadow.card,
            }}
          >
            <CardTitle>Resumen</CardTitle>
            <View style={{ padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Body color={text.muted} style={{ fontSize: 13 }}>Subtotal ({items.length} {items.length === 1 ? 'producto' : 'productos'})</Body>
                <Mono style={{ fontFamily: fonts.monoBold, fontSize: 14 }} color={text.heading}>{`$${total}`}</Mono>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={15} color={colors.azul[600]} />
                <Body color={text.muted} style={{ fontSize: 12.5, flex: 1 }}>{`Recoges en Cooperativa UTC · listo ~${maxPrep} min`}</Body>
              </View>
            </View>

            {/* Footer del recibo: total grande + botón con degradado */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.gris[100] }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Mono style={{ fontFamily: fonts.monoBold, fontSize: 14, marginTop: 4 }} color={text.heading}>$</Mono>
                <Mono style={{ fontFamily: fonts.monoBold, fontSize: 28, letterSpacing: 0.5 }} color={text.heading}>{`${total}`}</Mono>
              </View>
              <Pressable
                onPress={() => void onPay()}
                disabled={saving}
                style={{ borderRadius: 10, overflow: 'hidden', opacity: saving ? 0.7 : 1, ...shadow.card }}
              >
                <LinearGradient
                  colors={BTN_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, paddingHorizontal: 20 }}
                >
                  <Text style={{ color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 }}>
                    {saving ? 'Enviando…' : pay === 'efectivo' ? 'Confirmar pedido' : 'Pagar pedido'}
                  </Text>
                  {!saving ? <ArrowRight size={17} color="#fff" /> : null}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}

      <CardForm
        visible={cardFormOpen}
        kind={pay === 'tdd' ? 'tdd' : 'tdc'}
        onClose={() => setCardFormOpen(false)}
        onAdd={(card) => {
          addCard(card);
          const created = useWalletStore.getState().cards.at(-1);
          if (created) setSelectedCardId(created.id);
        }}
      />
    </SafeAreaView>
  );
}
