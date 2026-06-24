import { Pressable, Text } from 'react-native';
import type { ReactNode } from 'react';
import { colors, border, text, fonts } from '../theme';

type Props = {
  selected?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onPress: () => void;
};

/** Chip de categoría (seleccionable). */
export function Chip({ selected, icon, children, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 38,
        paddingHorizontal: 15,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? colors.naranja[500] : border.default,
        backgroundColor: selected ? colors.naranja[500] : '#fff',
      }}
    >
      {icon}
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: selected ? '#fff' : text.heading }}>{children}</Text>
    </Pressable>
  );
}
