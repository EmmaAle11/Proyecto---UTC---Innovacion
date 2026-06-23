import { View, Image, type StyleProp, type ViewStyle, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { colors } from '../theme';

const GRADIENT = [colors.azul[50], colors.naranja[50]] as const;

type Props = {
  height?: number;
  radius?: number;
  source?: ImageSourcePropType; // foto del producto (si existe)
  icon?: ReactNode; // ícono de fallback cuando no hay foto
  children?: ReactNode; // overlays (badges, etc.)
  style?: StyleProp<ViewStyle>;
};

/** Bloque visual del producto: muestra la foto (`source`) o, en su defecto, gradiente + ícono. */
export function Media({ height = 120, radius = 14, source, icon, children, style }: Props) {
  if (source) {
    return (
      <View style={[{ height, borderRadius: radius, overflow: 'hidden' }, style]}>
        <Image source={source} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        {children}
      </View>
    );
  }
  return (
    <LinearGradient
      colors={GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ height, borderRadius: radius, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}
    >
      {icon}
      {children}
    </LinearGradient>
  );
}
