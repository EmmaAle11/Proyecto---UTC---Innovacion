import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, surface, border, shadow } from '../../shared/theme';

/**
 * Barra de navegación del cliente en "píldora flotante" (inspirada en uiverse
 * great-badger-21, aproximada a nuestra identidad: paleta navy/naranja, no rosa).
 * Se renderiza EN FLUJO (reserva su altura) para no solaparse con el CTA flotante
 * del carrito en Inicio. El ítem activo se ilumina en naranja UTC.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: surface.page,
        paddingTop: 8,
        paddingBottom: insets.bottom + 8,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: surface.card,
          borderRadius: 28,
          padding: 7,
          gap: 6,
          borderWidth: 1,
          borderColor: border.subtle,
          ...shadow.floating,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? colors.naranja[600] : colors.azul[300];
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              style={{
                width: 58,
                height: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? colors.naranja[50] : 'transparent',
              }}
            >
              {options.tabBarIcon?.({ focused, color, size: 23 })}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
