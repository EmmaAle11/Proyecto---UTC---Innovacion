import { useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Wallet, CircleDollarSign, CreditCard, Landmark, Banknote, ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { Media } from '../../shared/ui/Media';
import { QtyStepper } from '../../shared/ui/QtyStepper';
import { PrimaryButton } from '../../shared/ui/PrimaryButton';
import { Display, Title, Body, Label, Mono } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow, fonts } from '../../shared/theme';
import { productImage } from '../../entities/product/images';
import { productIcon } from '../../entities/product/icons';
import { useCartStore, selectTotal } from '../../features/cart/model/cart.store';
import { useOrdersStore } from '../../features/orders/model/orders.store';
import { useSessionStore } from '../../features/auth/model/session.store';
import type { PaymentMethod } from '../../entities/order/model/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Cart'>;

// Métodos de pago (BR-009). Selector solo VISUAL — pagos diferidos (D-006).
const METHODS = [
  { k: 'mercado_pago', l: 'Mercado Pago', s: 'Saldo o tarjeta guardada', Icon: Wallet },
  { k: 'paypal', l: 'PayPal', s: 'Tu cuenta PayPal', Icon: CircleDollarSign },
  { k: 'tdc', l: 'Tarjeta de crédito (TDC)', s: 'Visa · Mastercard · Amex', Icon: CreditCard },
  { k: 'tdd', l: 'Tarjeta de débito (TDD)', s: 'Débito de tu banco', Icon: Landmark },
  { k: 'efectivo', l: 'Efectivo al recoger', s: 'Paga en el mostrador de la cooperativa', Icon: Banknote },
] as const;

/** Carrito / checkout: aviso de pickup, ítems editables, método de pago (visual) y total. */
export function CartScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const token = useSessionStore((s) => s.session?.accessToken);
  const total = selectTotal(items);
  const [pay, setPay] = useState<string>('mercado_pago');
  const [saving, setSaving] = useState(false);
  const maxPrep = items.reduce((m, it) => Math.max(m, Math.round(it.product.basePrepTimeSeconds / 60)), 0);

  const onPay = async () => {
    if (saving || items.length === 0) return;
    setSaving(true);
    try {
      // El backend snapshotea precio/total (BR-015) y crea orden+pago; abre el Seguimiento.
      await placeOrder(
        {
          items: items.map((it) => ({ productId: it.product.id, quantity: it.qty })),
          payMethod: pay as PaymentMethod,
        },
        token,
      );
      clear();
      navigation.replace('Tracking');
    } catch (e) {
      Alert.alert(
        'No se pudo enviar el pedido',
        e instanceof Error ? e.message : 'Intenta de nuevo',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
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
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12, padding: 14, backgroundColor: colors.azul[50], borderWidth: 1, borderColor: colors.azul[100], borderRadius: 16, marginBottom: 18 }}>
              <MapPin size={22} color={colors.azul[700]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Title style={{ fontSize: 14 }} color={text.heading}>Recoges en Cooperativa UTC</Title>
                <Body color={colors.gris[600]} style={{ fontSize: 12.5, marginTop: 2 }}>{`Listo en ~${maxPrep} min · ventana de recogida 10–20 min`}</Body>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {items.map((it) => {
                const Icon = productIcon(it.product.icon);
                return (
                  <View key={it.product.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, borderRadius: 16, padding: 10, ...shadow.card }}>
                    <Media height={56} radius={12} style={{ width: 56 }} source={productImage(it.product)} icon={<Icon size={24} color={colors.azul[300]} />} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Title style={{ fontSize: 14.5 }} numberOfLines={1}>{it.product.name}</Title>
                      <Mono style={{ fontFamily: fonts.monoBold, fontSize: 14, marginTop: 3 }} color={text.heading}>{`$${it.product.price}`}</Mono>
                    </View>
                    <QtyStepper value={it.qty} min={0} max={10} size="sm" onChange={(v) => setQty(it.product.id, v)} />
                  </View>
                );
              })}
            </View>

            <Label style={{ marginTop: 24, marginBottom: 11 }}>Método de pago</Label>
            <View style={{ gap: 10 }}>
              {METHODS.map((m) => {
                const on = pay === m.k;
                const Icon = m.Icon;
                return (
                  <Pressable
                    key={m.k}
                    onPress={() => setPay(m.k)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 16, backgroundColor: surface.card, borderWidth: on ? 2 : 1, borderColor: on ? colors.naranja[500] : border.subtle, ...shadow.card }}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.naranja[50] : colors.gris[100] }}>
                      <Icon size={19} color={on ? colors.naranja[600] : colors.azul[700]} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Title style={{ fontSize: 14.5 }} numberOfLines={1}>{m.l}</Title>
                      <Body color={text.muted} style={{ fontSize: 11.5, marginTop: 1 }}>{m.s}</Body>
                    </View>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: on ? 6 : 2, borderColor: on ? colors.naranja[500] : border.strong }} />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 16, backgroundColor: surface.card, borderTopWidth: 1, borderTopColor: border.subtle }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <Label>Total</Label>
              <Mono style={{ fontFamily: fonts.monoBold, fontSize: 26, letterSpacing: 0.5 }} color={text.heading}>{`$${total}`}</Mono>
            </View>
            <PrimaryButton
              color={colors.naranja[500]}
              onPress={() => void onPay()}
              disabled={saving}
              icon={<ArrowRight size={18} color="#fff" />}
              label={saving ? 'Enviando…' : pay === 'efectivo' ? 'Confirmar y enviar a cocina' : 'Pagar y enviar a cocina'}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
