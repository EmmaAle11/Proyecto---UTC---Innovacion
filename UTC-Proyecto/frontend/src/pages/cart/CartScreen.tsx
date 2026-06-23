import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Wallet, CircleDollarSign, CreditCard, Landmark, Banknote, ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { Media } from '../../shared/ui/Media';
import { QtyStepper } from '../../shared/ui/QtyStepper';
import { PrimaryButton } from '../../shared/ui/PrimaryButton';
import { colors, text, border } from '../../shared/theme';
import { productImage } from '../../entities/product/images';
import { productIcon } from '../../entities/product/icons';
import { useCartStore, selectTotal } from '../../features/cart/model/cart.store';

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
  const total = selectTotal(items);
  const [pay, setPay] = useState<string>('mercado_pago');
  const maxPrep = items.reduce((m, it) => Math.max(m, Math.round(it.product.basePrepTimeSeconds / 60)), 0);

  const onPay = () => {
    // Pago simulado (D-006) → Seguimiento (código + tracker). Reemplaza el carrito en el stack.
    clear();
    navigation.replace('Tracking');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.gris[50] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: border.subtle, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color={colors.azul[700]} />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: '800', color: text.heading }}>Tu pedido</Text>
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Text style={{ color: text.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
            Tu carrito está vacío.{'\n'}Vuelve al menú y arma tu antojo.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12, padding: 14, backgroundColor: colors.azul[50], borderRadius: 16, marginBottom: 18 }}>
              <MapPin size={22} color={colors.azul[700]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: text.heading }}>Recoges en Cooperativa UTC</Text>
                <Text style={{ fontSize: 12.5, color: colors.gris[600], marginTop: 2 }}>{`Listo en ~${maxPrep} min · ventana de recogida 10–20 min`}</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {items.map((it) => {
                const Icon = productIcon(it.product.icon);
                return (
                  <View key={it.product.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: border.subtle, borderRadius: 16, padding: 10 }}>
                    <Media height={56} radius={12} style={{ width: 56 }} source={productImage(it.product.id)} icon={<Icon size={24} color={colors.azul[300]} />} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14.5, color: text.heading }}>{it.product.name}</Text>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: colors.naranja[600], marginTop: 2 }}>{`$${it.product.price}`}</Text>
                    </View>
                    <QtyStepper value={it.qty} min={0} max={10} size="sm" onChange={(v) => setQty(it.product.id, v)} />
                  </View>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: text.heading, marginTop: 22, marginBottom: 10 }}>Método de pago</Text>
            <View style={{ gap: 10 }}>
              {METHODS.map((m) => {
                const on = pay === m.k;
                const Icon = m.Icon;
                return (
                  <Pressable
                    key={m.k}
                    onPress={() => setPay(m.k)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 14, backgroundColor: '#fff', borderWidth: on ? 2 : 1, borderColor: on ? colors.naranja[500] : border.default }}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.naranja[50] : colors.gris[100] }}>
                      <Icon size={19} color={on ? colors.naranja[600] : colors.azul[700]} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14.5, color: text.heading }}>{m.l}</Text>
                      <Text style={{ fontSize: 11.5, color: text.muted, marginTop: 1 }}>{m.s}</Text>
                    </View>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: on ? 6 : 2, borderColor: on ? colors.naranja[500] : border.strong }} />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: border.subtle }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: text.muted }}>Total</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: text.heading }}>{`$${total}`}</Text>
            </View>
            <PrimaryButton
              color={colors.naranja[500]}
              onPress={onPay}
              icon={<ArrowRight size={18} color="#fff" />}
              label={pay === 'efectivo' ? 'Confirmar y enviar a cocina' : 'Pagar y enviar a cocina'}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
