import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChefHat, CircleCheckBig, Timer } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { OrderTracker } from '../../shared/ui/OrderTracker';
import { PrimaryButton } from '../../shared/ui/PrimaryButton';
import { colors, text, border, state } from '../../shared/theme';
import { ACTIVE_ORDER } from '../../entities/order/mock';

type Props = NativeStackScreenProps<MainStackParamList, 'Tracking'>;

/** Seguimiento del pedido: código de recogida + tracker que avanza a "Listo" (demo). */
export function TrackingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1); // 0 Pagado · 1 En preparación · 2 Listo · 3 Recogido
  useEffect(() => {
    const t = setTimeout(() => setStep(2), 3500);
    return () => clearTimeout(t);
  }, []);
  const ready = step >= 2;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.gris[50] }}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 22 }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: ready ? colors.lima[50] : state.cooking.bg }}>
            {ready ? <CircleCheckBig size={38} color={colors.lima[500]} /> : <ChefHat size={38} color={colors.mango[600]} />}
          </View>
          <Text style={{ fontSize: 23, fontWeight: '800', color: text.heading, marginBottom: 6, textAlign: 'center' }}>
            {ready ? '¡Tu pedido está listo!' : 'Estamos preparando tu pedido'}
          </Text>
          <Text style={{ fontSize: 14.5, color: colors.gris[600], textAlign: 'center' }}>
            {ready ? 'Pásale a recogerlo a la cooperativa.' : 'Te avisamos en cuanto esté en el mostrador.'}
          </Text>
        </View>

        <View style={{ backgroundColor: colors.azul[700], borderRadius: 20, padding: 22, marginBottom: 18 }}>
          <Text style={{ fontSize: 12, color: colors.azul[200], fontWeight: '600', letterSpacing: 1, marginBottom: 6 }}>CÓDIGO DE RECOGIDA</Text>
          <Text style={{ fontSize: 40, fontWeight: '800', letterSpacing: 3, color: '#fff' }}>{ACTIVE_ORDER.code}</Text>
          <Text style={{ fontSize: 12.5, color: colors.azul[200], marginTop: 4 }}>Muéstralo en el mostrador de la cooperativa</Text>
        </View>

        <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: border.subtle, borderRadius: 18, paddingVertical: 22, paddingHorizontal: 14, marginBottom: 16 }}>
          <OrderTracker current={step} note={ready ? 'Listo hace 0 min' : ACTIVE_ORDER.etaLabel} />
        </View>

        {ready ? (
          <View style={{ flexDirection: 'row', gap: 12, padding: 14, backgroundColor: state.ready.bg, borderRadius: 16 }}>
            <Timer size={22} color={colors.lima[600]} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.lima[600], lineHeight: 19 }}>
              <Text style={{ fontWeight: '700' }}>Recoge en 10–20 min</Text> para que llegue calientito. Pasado ese tiempo podría volver a ofertarse como "Preparados".
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: border.subtle }}>
        <PrimaryButton
          color={ready ? colors.naranja[500] : colors.azul[700]}
          onPress={() => navigation.popToTop()}
          label={ready ? 'Volver al menú' : 'Seguir explorando el menú'}
        />
      </View>
    </SafeAreaView>
  );
}
