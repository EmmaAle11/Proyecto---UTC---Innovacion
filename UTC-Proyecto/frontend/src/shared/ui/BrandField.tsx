import { View, Text, TextInput, Platform, type StyleProp, type ViewStyle, type TextStyle, type TextInputProps } from 'react-native';
import type { ReactNode } from 'react';
import { border, colors, fonts, text } from '../theme';

// En react-native-web el TextInput se renderiza como <input> y el navegador le
// pinta su anillo de foco (el "margen" azul que aparece al llegar con Tab). Lo
// quitamos solo en web; `outlineStyle` es una prop de estilo exclusiva de RNW y
// no existe en TextStyle, de ahí el doble cast.
const WEB_NO_OUTLINE: TextStyle | undefined =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : undefined;

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

const ACCENT = colors.azul[600];
const IDLE = border.subtle;

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
          placeholderTextColor={colors.gris[400]}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[{ flex: 1, fontSize: 15, color: text.heading, fontFamily: fonts.bodyMedium }, WEB_NO_OUTLINE]}
        />
        {rightSlot}
      </View>
      {hint ? <Text style={{ fontSize: 12, color: text.muted, marginTop: 4, fontFamily: fonts.body }}>{hint}</Text> : null}
    </View>
  );
}
