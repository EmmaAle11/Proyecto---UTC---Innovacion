import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { colors, state, fonts } from '../theme';

export type BadgeTone = 'neutral' | 'primary' | 'cooking' | 'ready' | 'reoffer' | 'success';

const TONES: Record<BadgeTone, { bg: string; fg: string; dot: string }> = {
  neutral: { bg: colors.gris[100], fg: colors.gris[700], dot: colors.gris[400] },
  primary: { bg: colors.naranja[50], fg: colors.naranja[700], dot: colors.naranja[500] },
  cooking: state.cooking,
  ready: state.ready,
  reoffer: state.reoffer,
  success: { bg: colors.lima[50], fg: colors.lima[600], dot: colors.lima[500] },
};

type Props = {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Píldora de estado (Preparado · En preparación · Listo…). Tonos del sistema de diseño. */
export function Badge({ tone = 'neutral', dot, icon, children, style }: Props) {
  const t = TONES[tone];
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: t.bg },
        style,
      ]}
    >
      {dot ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.dot }} /> : null}
      {icon}
      <Text style={{ color: t.fg, fontFamily: fonts.bodyBold, fontSize: 12 }}>{children}</Text>
    </View>
  );
}
