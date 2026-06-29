import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { colors } from '../theme';

/**
 * Loader "cafetera" (reconstrucción RN del componente uiverse strong-gecko-19):
 * máquina sirviendo café con humo en bucle. Sin pseudo-elementos ni @keyframes
 * (no existen en RN): se arma con Views y se anima con la Animated API. Acentos en
 * verde lima (identidad UTC) sobre los tonos café del original. Indica "preparando".
 */
const C = {
  body: '#ddcfcc',
  dot: '#282323',
  detail: '#9b9091',
  display: '#9acfc5',
  ring: colors.lima[500],
  medium: '#bcb0af',
  inner: '#776f6e',
  black: '#231f20',
  tip: '#9e9495',
  cup: '#ffffff',
  liquid: '#74372b',
  smoke: '#b3aeae',
  base: colors.lima[600],
};

/** Una voluta de humo que sube y se desvanece en bucle (con retardo de fase). */
function Smoke({ left, delay }: { left: number; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false, // false: el bucle se repite también en react-native-web
        }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const opacity = v.interpolate({
    inputRange: [0, 0.4, 0.5, 0.8, 1],
    outputRange: [0, 0.5, 0.3, 0.5, 0],
  });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 70,
        left,
        width: 7,
        height: 18,
        borderRadius: 5,
        backgroundColor: C.smoke,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

export function CoffeeLoader() {
  // Chorro de café: cae desde la salida hacia la taza y se REPITE cada 3 s.
  const pour = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pour, {
          toValue: 1,
          duration: 1400,
          easing: Easing.linear,
          useNativeDriver: false, // false: relooping fiable en web
        }),
        Animated.timing(pour, { toValue: 0, duration: 0, useNativeDriver: false }),
        Animated.delay(1600), // pausa hasta completar el ciclo de 3 s
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pour]);
  // Cae DESDE la boquilla (translateY 0) HACIA la taza (translateY +50), no desde arriba.
  const pourY = pour.interpolate({ inputRange: [0, 1], outputRange: [0, 50] });
  const pourOpacity = pour.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={{ width: 190, height: 250, alignItems: 'center' }}>
      {/* Cabezal */}
      <View
        style={{
          width: 170,
          height: 70,
          backgroundColor: C.body,
          borderRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
        }}
      >
        <View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.dot }} />
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.dot }} />
          </View>
        </View>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: C.display,
            borderWidth: 4,
            borderColor: C.ring,
          }}
        />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <View style={{ width: 6, height: 18, backgroundColor: C.detail }} />
          <View style={{ width: 6, height: 18, backgroundColor: C.detail }} />
          <View style={{ width: 6, height: 18, backgroundColor: C.detail }} />
        </View>
      </View>

      {/* Cuerpo medio */}
      <View style={{ width: 150, height: 140, backgroundColor: C.medium, position: 'relative' }}>
        {/* hueco interior oscuro */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: '5%',
            width: '90%',
            height: 92,
            backgroundColor: C.inner,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        />
        {/* brazo */}
        <View style={{ position: 'absolute', top: 12, right: 18, width: 60, height: 16, backgroundColor: C.black }}>
          <View style={{ position: 'absolute', top: 6, left: -14, width: 14, height: 5, backgroundColor: C.tip }} />
        </View>
        {/* salida / boquilla */}
        <View style={{ position: 'absolute', top: 0, left: 45, width: 56, alignItems: 'center' }}>
          <View style={{ width: 56, height: 16, backgroundColor: C.black }} />
          <View style={{ width: 46, height: 14, backgroundColor: C.black, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }} />
          <View style={{ width: 10, height: 8, backgroundColor: C.black }} />
        </View>
        {/* chorro de café: nace en la boquilla (top 40, centrado bajo la salida) y cae */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 40,
            left: 71,
            width: 5,
            height: 20,
            borderRadius: 3,
            backgroundColor: C.liquid,
            opacity: pourOpacity,
            transform: [{ translateY: pourY }],
          }}
        />
        {/* humo */}
        <Smoke left={58} delay={0} />
        <Smoke left={74} delay={900} />
        <Smoke left={92} delay={1800} />
        <Smoke left={108} delay={1350} />
        {/* taza */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 37,
            width: 76,
            height: 44,
            backgroundColor: C.cup,
            borderBottomLeftRadius: 60,
            borderBottomRightRadius: 60,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: -12,
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 4,
              borderColor: C.cup,
            }}
          />
        </View>
      </View>

      {/* Base */}
      <View
        style={{
          width: 162,
          height: 14,
          backgroundColor: C.base,
          borderRadius: 10,
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }}
      />
    </View>
  );
}
