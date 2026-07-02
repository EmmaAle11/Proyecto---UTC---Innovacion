import { useCallback } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ChefHat, CircleCheckBig, Timer, PackageCheck, Receipt, CircleSlash } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';
import { OrderTracker } from '../../shared/ui/OrderTracker';
import { CoffeeLoader } from '../../shared/ui/CoffeeLoader';
import { PrimaryButton } from '../../shared/ui/PrimaryButton';
import { Display, Heading, Body, Label, Mono } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow, fonts, radius, space, state } from '../../shared/theme';
import { useOrdersStore, trackerStep } from '../../features/orders/model/orders.store';
import { useSessionStore } from '../../features/auth/model/session.store';

type Props = NativeStackScreenProps<MainStackParamList, 'Tracking'>;

/**
 * Seguimiento del pedido: lee el estado EN VIVO del store compartido (lo que el
 * admin marca aparece aquí). Código de recogida + tracker derivado del estado.
 */
export function TrackingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const order = useOrdersStore((s) => s.orders.find((o) => o.id === s.activeOrderId));
  const cancelMine = useOrdersStore((s) => s.cancelMine);
  const extendMine = useOrdersStore((s) => s.extendMine);
  const loadMine = useOrdersStore((s) => s.loadMine);
  const token = useSessionStore((s) => s.session?.accessToken);

  // Trae el estado real al abrir/volver a esta pantalla (además del sondeo de fondo cada 15 s).
  // Sin esto, el seguimiento dependía solo del polling y podía quedarse mostrando "Listo".
  useFocusEffect(
    useCallback(() => {
      void loadMine(token);
    }, [token, loadMine]),
  );

  // Sin pedido en curso (nunca se envió uno): estado vacío.
  if (!order) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: surface.page }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Receipt size={46} color={colors.gris[300]} />
          <Display style={{ marginTop: 16, textAlign: 'center' }}>Sin pedido{'\n'}en curso</Display>
          <Body color={text.muted} style={{ marginTop: 10, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
            Arma tu antojo en el menú y te avisamos en cuanto esté en el mostrador.
          </Body>
        </View>
        <View style={{ paddingHorizontal: space[5], paddingBottom: insets.bottom + space[2] }}>
          <PrimaryButton color={colors.naranja[500]} onPress={() => navigation.popToTop()} label="Ir al menú" />
        </View>
      </SafeAreaView>
    );
  }

  const step = trackerStep(order.status);
  const ready = order.status === 'ready' || order.status === 'ready_later';
  const done = order.status === 'picked_up';
  const failed = order.status === 'cancelled' || order.status === 'not_picked_up';

  const onCancel = () => {
    Alert.alert('Cancelar pedido', '¿Seguro que quieres cancelar tu pedido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () =>
          void cancelMine(order.id, token).catch((e: unknown) =>
            Alert.alert(
              'No se pudo cancelar',
              e instanceof Error ? e.message : 'Intenta de nuevo',
            ),
          ),
      },
    ]);
  };
  const onExtend = () =>
    void extendMine(order.id, token).catch((e: unknown) =>
      Alert.alert(
        'No se pudo extender',
        e instanceof Error ? e.message : 'Intenta de nuevo',
      ),
    );

  const hero = failed
    ? { icon: <CircleSlash size={38} color={colors.rojo[500]} />, bg: colors.rojo[50], accent: colors.rojo[500], title: order.status === 'cancelled' ? 'Pedido\ncancelado' : 'No se\nrecogió', sub: 'Si fue un error, vuelve a pedir desde el menú.' }
    : done
      ? { icon: <PackageCheck size={38} color={colors.lima[500]} />, bg: colors.lima[50], accent: colors.lima[500], title: '¡Pedido\nrecogido!', sub: 'Gracias por tu compra. ¡Buen provecho!' }
      : ready
        ? { icon: <CircleCheckBig size={38} color={colors.lima[500]} />, bg: colors.lima[50], accent: colors.lima[500], title: '¡Tu pedido\nestá listo!', sub: 'Pásale a recogerlo a la cooperativa.' }
        : { icon: <ChefHat size={38} color={colors.mango[600]} />, bg: state.cooking.bg, accent: colors.naranja[500], title: order.status === 'pending' ? 'Pedido\nrecibido' : 'Estamos\npreparando\ntu pedido', sub: order.status === 'pending' ? 'En cuanto la cocina lo acepte, empieza la preparación.' : 'Te avisamos en cuanto esté en el mostrador.' };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: surface.page }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space[5], paddingTop: space[5], paddingBottom: space[6] }} showsVerticalScrollIndicator={false}>
        {/* HERO editorial de estado */}
        <View style={{ paddingTop: space[1], paddingBottom: space[6] }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: space[4], backgroundColor: hero.bg }}>
            {hero.icon}
          </View>
          <Display>{hero.title}</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: hero.accent, marginTop: space[3], marginBottom: space[4] }} />
          <Body color={text.muted} style={{ fontSize: 15, lineHeight: 22 }}>{hero.sub}</Body>
        </View>

        {/* Cafetera en marcha mientras la cocina prepara (estado preparing) */}
        {order.status === 'preparing' ? (
          <View style={{ alignItems: 'center', marginBottom: space[5] }}>
            <CoffeeLoader />
            <Body color={text.muted} style={{ fontSize: 13, marginTop: space[2] }}>
              Tu pedido se está preparando…
            </Body>
          </View>
        ) : null}

        {/* TARJETA DE CÓDIGO DE RECOGIDA — ticket navy */}
        <View style={{ backgroundColor: surface.ink, borderRadius: radius.card, paddingVertical: space[6], paddingHorizontal: space[5], marginBottom: space[5], ...shadow.floating }}>
          <Label color={text.onInkMuted}>Tu código de recogida</Label>
          <Mono color={text.onInk} style={{ fontFamily: fonts.monoBold, fontSize: 48, lineHeight: 56, letterSpacing: 6, marginTop: space[2] }}>{order.code}</Mono>
          <Body color={text.onInkMuted} style={{ fontSize: 13, marginTop: space[2] }}>Muéstralo en el mostrador de la cooperativa</Body>
        </View>

        {/* TRACKER (en vivo) */}
        {!failed ? (
          <View style={{ backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, borderRadius: radius.lg, paddingVertical: space[6], paddingHorizontal: space[4], marginBottom: space[4], ...shadow.card }}>
            <OrderTracker current={step} note={ready ? 'Listo' : order.status === 'preparing' ? 'En cocina' : undefined} />
          </View>
        ) : null}

        {/* AVISO de ventana de recogida */}
        {ready ? (
          <View style={{ flexDirection: 'row', gap: space[3], padding: space[4], backgroundColor: state.ready.bg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.lima[100] }}>
            <Timer size={22} color={colors.lima[600]} />
            <View style={{ flex: 1 }}>
              <Heading style={{ fontSize: 16, lineHeight: 20, marginBottom: 4 }} color={colors.lima[600]}>Recoge en 10–20 min</Heading>
              <Body color={colors.lima[600]} style={{ fontSize: 13, lineHeight: 19 }}>
                Para que llegue calientito. Pasado ese tiempo podría volver a ofertarse como "Preparados".
              </Body>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: space[5], paddingTop: space[4], paddingBottom: insets.bottom + space[2], backgroundColor: surface.card, borderTopWidth: 1, borderTopColor: border.subtle }}>
        {/* Acciones del cliente sobre SU pedido (§3.8/§3.10) */}
        {order.status === 'ready' ? (
          <Pressable onPress={onExtend} style={{ alignItems: 'center', paddingVertical: 12, marginBottom: 2 }}>
            <Body color={colors.naranja[600]} style={{ fontSize: 14, fontFamily: fonts.bodySemi }}>
              Extender para recoger después
            </Body>
          </Pressable>
        ) : null}
        {order.status === 'pending' ? (
          <Pressable onPress={onCancel} style={{ alignItems: 'center', paddingVertical: 12, marginBottom: 2 }}>
            <Body color={colors.rojo[500]} style={{ fontSize: 14, fontFamily: fonts.bodySemi }}>
              Cancelar pedido
            </Body>
          </Pressable>
        ) : null}
        <PrimaryButton
          color={ready || done ? colors.naranja[500] : colors.azul[700]}
          onPress={() => navigation.popToTop()}
          label={ready || done || failed ? 'Volver al menú' : 'Seguir explorando el menú'}
        />
      </View>
    </SafeAreaView>
  );
}
