import { View, Text, TextInput, type StyleProp, type ViewStyle, type TextInputProps } from 'react-native';
import type { ReactNode } from 'react';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  secure?: boolean;
  hint?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  containerStyle?: StyleProp<ViewStyle>;
};

const ACCENT = '#E34100';
const IDLE = '#DEE2EA';

/**
 * Campo de formulario de marca (compartido por las pantallas de auth).
 * Icono opcional a la izquierda, ojo/acción opcional a la derecha, hint opcional debajo.
 * El foco lo controla la pantalla (prop `focused`) para que un solo campo esté activo a la vez.
 */
export function BrandField({
  value,
  onChangeText,
  placeholder,
  focused,
  onFocus,
  onBlur,
  icon,
  rightSlot,
  secure,
  hint,
  keyboardType,
  autoCapitalize,
  containerStyle,
}: Props) {
  return (
    <View style={containerStyle}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          height: 52,
          paddingHorizontal: 14,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: focused ? ACCENT : IDLE,
        }}
      >
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="#9BA4B5"
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{ flex: 1, fontSize: 15, color: '#021E5E' }}
        />
        {rightSlot}
      </View>
      {hint ? <Text style={{ fontSize: 12, color: '#6C7689', marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}
