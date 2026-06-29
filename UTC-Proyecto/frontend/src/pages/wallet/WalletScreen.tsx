import { useRef, useState } from 'react';
import { View, Pressable, Animated, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { Display, Title, Body, Label, Mono } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow, fonts } from '../../shared/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Wallet'>;

type WalletCard = {
  id: string;
  brand: string;
  bg: string;
  fg: string;
  label: string;
  value: string;
  masked: string;
  full: string;
  bottom: number;
  lift: number;
};

/**
 * Cartera del cliente (reconstrucción RN del componente uiverse rude-bat-50, en
 * paleta UTC): tarjetas de pago apiladas dentro de un bolsillo (SVG real), más un
 * "billete" de EFECTIVO (BR-009). En móvil no hay hover → se TOCA para abrir la
 * cartera (las tarjetas suben y se revela el número/saldo). Pagos en demo (D-006).
 */
const CARDS: WalletCard[] = [
  { id: 'mp', brand: 'Mercado Pago', bg: colors.azul[500], fg: '#ffffff', label: 'Titular', value: 'ALUMNO UTC', masked: '**** 4242', full: '5524 9910 4242', bottom: 98, lift: -84 },
  { id: 'tdc', brand: 'Tarjeta UTC', bg: colors.azul[700], fg: '#ffffff', label: 'Crédito', value: 'ALUMNO UTC', masked: '**** 8810', full: '9012 4432 8810', bottom: 76, lift: -58 },
  { id: 'pp', brand: 'PayPal', bg: '#ffffff', fg: colors.azul[700], label: 'Correo', value: 'alumno@edu.utc.mx', masked: '**** 0094', full: '3312 0045 0094', bottom: 54, lift: -32 },
  { id: 'cash', brand: 'Efectivo', bg: colors.lima[500], fg: '#ffffff', label: 'Pago', value: 'EN MOSTRADOR', masked: 'BILLETE', full: 'Paga al recoger', bottom: 32, lift: -8 },
];

function Chip({ tint }: { tint: string }) {
  return (
    <View style={{ width: 32, height: 24, borderRadius: 4, backgroundColor: tint, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} />
  );
}

export function WalletScreen({ navigation }: Props) {
  const a = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.spring(a, { toValue: next ? 1 : 0, useNativeDriver: true, friction: 8, tension: 60 }).start();
  };
  const starsOpacity = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const realOpacity = a.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

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
          <Display style={{ fontSize: 28, lineHeight: 32 }}>Mi cartera</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 8 }} />
        </View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Cartera: toca para abrir/cerrar */}
        <Pressable onPress={toggle} style={{ width: 300, height: 260 }}>
          {/* respaldo de la cartera */}
          <View style={{ position: 'absolute', bottom: 0, left: 10, width: 280, height: 200, backgroundColor: colors.azul[900], borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 60, borderBottomRightRadius: 60 }} />

          {/* Tarjetas apiladas (suben al abrir) */}
          {CARDS.map((c) => {
            const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, c.lift] });
            return (
              <Animated.View
                key={c.id}
                style={{
                  position: 'absolute',
                  left: 20,
                  bottom: c.bottom,
                  width: 260,
                  height: 140,
                  borderRadius: 16,
                  padding: 16,
                  backgroundColor: c.bg,
                  transform: [{ translateY }],
                  justifyContent: 'space-between',
                  ...shadow.card,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1, color: c.fg, textTransform: 'uppercase' }}>{c.brand}</Text>
                  <Chip tint={c.bg === '#ffffff' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.2)'} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 8, letterSpacing: 1, opacity: 0.7, color: c.fg, textTransform: 'uppercase', marginBottom: 2 }}>{c.label}</Text>
                    <Text style={{ fontSize: 11, fontFamily: fonts.bodySemi, color: c.fg }}>{c.value}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.monoBold, fontSize: open ? 13 : 15, letterSpacing: 1, color: c.fg }}>
                    {open ? c.full : c.masked}
                  </Text>
                </View>
              </Animated.View>
            );
          })}

          {/* Bolsillo (SVG real con el path original) */}
          <View style={{ position: 'absolute', bottom: 0, left: 10, width: 280, height: 160 }}>
            <Svg width={280} height={160} viewBox="0 0 280 160" fill="none">
              <Path
                d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z"
                fill={colors.azul[900]}
              />
              <Path
                d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z"
                stroke={colors.azul[600]}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            </Svg>
            {/* Saldo (demo): estrellas → valor al abrir */}
            <View style={{ position: 'absolute', top: 46, left: 0, right: 0, alignItems: 'center' }}>
              <View style={{ height: 26, justifyContent: 'center' }}>
                <Animated.Text style={{ position: 'absolute', alignSelf: 'center', fontFamily: fonts.monoBold, fontSize: 22, letterSpacing: 4, color: colors.azul[200], opacity: starsOpacity }}>
                  ✱✱✱✱✱✱
                </Animated.Text>
                <Animated.Text style={{ fontFamily: fonts.monoBold, fontSize: 20, color: colors.lima[100], opacity: realOpacity }}>
                  $0.00
                </Animated.Text>
              </View>
              <Body style={{ fontSize: 11, marginTop: 4 }} color={colors.azul[200]}>Saldo (demo)</Body>
              <View style={{ marginTop: 6, opacity: 0.85 }}>
                {open ? <Eye size={18} color={colors.lima[500]} /> : <EyeOff size={18} color={colors.lima[500]} />}
              </View>
            </View>
          </View>
        </Pressable>

        <Label style={{ marginTop: 18 }} color={text.muted}>{open ? 'Toca para cerrar' : 'Toca la cartera para ver tus tarjetas'}</Label>
      </View>

      {/* Nota de alcance */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
        <Body color={text.subtle} style={{ fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
          Tus métodos de pago (Mercado Pago, PayPal, tarjeta y efectivo en mostrador). El cobro real llega en una versión futura — por ahora es demostración.
        </Body>
      </View>
    </SafeAreaView>
  );
}
