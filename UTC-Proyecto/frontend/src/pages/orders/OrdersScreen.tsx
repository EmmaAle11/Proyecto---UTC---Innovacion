import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt, ArrowRight, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { Badge } from '../../shared/ui/Badge';
import { OrderTracker } from '../../shared/ui/OrderTracker';
import { colors, text, border, surface } from '../../shared/theme';
import { ACTIVE_ORDER, ORDER_HISTORY } from '../../entities/order/mock';

/** Pestaña Pedidos: pedido activo (con tracker → Seguimiento) + historial. */
export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const hasActive = true; // mock; en el turno de datos vendrá de GET /orders/active

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: text.heading, marginBottom: 16 }}>Tus pedidos</Text>

        {hasActive ? (
          <Pressable
            onPress={() => navigation.navigate('Tracking')}
            style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: border.subtle, borderRadius: 18, padding: 16, marginBottom: 18 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontWeight: '800', fontSize: 16, color: colors.azul[700] }}>{`#${ACTIVE_ORDER.code}`}</Text>
              <Badge tone="cooking" dot>En preparación</Badge>
            </View>
            <OrderTracker current={ACTIVE_ORDER.trackerStep} note={ACTIVE_ORDER.etaLabel} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14 }}>
              <Text style={{ fontSize: 13, color: colors.naranja[600], fontWeight: '700' }}>Ver seguimiento</Text>
              <ArrowRight size={15} color={colors.naranja[600]} />
            </View>
          </Pressable>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Receipt size={44} color={colors.gris[300]} />
            <Text style={{ marginTop: 12, fontSize: 15, color: text.muted, textAlign: 'center', lineHeight: 22 }}>
              Aún no tienes pedidos.{'\n'}Tu próximo antojo aparecerá aquí.
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, color: text.muted, marginBottom: 10, textTransform: 'uppercase' }}>Historial</Text>
        {ORDER_HISTORY.map((o) => (
          <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: border.subtle }}>
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: colors.lima[50], alignItems: 'center', justifyContent: 'center' }}>
              <Check size={18} color={colors.lima[600]} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '700', fontSize: 14, color: text.heading }}>{o.summary}</Text>
              <Text style={{ fontSize: 12, color: text.muted }}>{`#${o.code} · ${o.whenLabel} · Recogido`}</Text>
            </View>
            <Text style={{ fontWeight: '700', color: text.heading }}>{`$${o.total}`}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
