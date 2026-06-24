import { Pressable, Text, View } from 'react-native';
import { border, text, fonts } from '../theme';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md';
};

/** Selector de cantidad (− N +). */
export function QtyStepper({ value, min = 1, max = 20, onChange, size = 'md' }: Props) {
  const dim = size === 'sm' ? 30 : 38;
  const renderBtn = (label: string, target: number, off: boolean) => (
    <Pressable
      onPress={off ? undefined : () => onChange(target)}
      disabled={off}
      style={{ width: dim, height: dim, borderRadius: dim / 2, borderWidth: 1.5, borderColor: border.default, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 18, fontFamily: fonts.bodyBold, color: off ? text.subtle : text.heading }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {renderBtn('−', value - 1, value <= min)}
      <Text style={{ fontFamily: fonts.monoBold, fontSize: 17, minWidth: 22, textAlign: 'center', color: text.heading, fontVariant: ['tabular-nums'] }}>{value}</Text>
      {renderBtn('+', value + 1, value >= max)}
    </View>
  );
}
