import { Pressable, Text, ActivityIndicator } from 'react-native';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  onPress: () => void;
  color: string; // color de fondo según el rol (naranja cliente / azul admin)
  loading?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
};

/** CTA full-width de marca (compartido por las pantallas de auth). */
export function PrimaryButton({ label, onPress, color, loading, icon, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled ?? loading}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 54,
        borderRadius: 16,
        backgroundColor: color,
        marginTop: 2,
        shadowColor: color,
        shadowOpacity: 0.32,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        opacity: loading ? 0.85 : 1,
      }}
    >
      {loading ? <ActivityIndicator color="#fff" /> : icon}
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15.5 }}>{label}</Text>
    </Pressable>
  );
}
