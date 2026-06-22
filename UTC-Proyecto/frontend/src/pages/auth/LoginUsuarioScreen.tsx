import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Info } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { LogoSymbol } from '../../shared/ui/LogoSymbol';
import { MicrosoftGlyph } from '../../shared/ui/MicrosoftGlyph';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginUsuario'>;

const PILLS = ['⏱ Tiempos visibles', '📍 Pick Up', '✓ Paga con tarjeta'];

/** Login del cliente: SSO con Outlook institucional (de design-system login-usuario.html). */
export function LoginUsuarioScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Mock: en Fase 1 esto abre el flujo OAuth de Keycloak -> Microsoft (expo-auth-session).
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Main');
    }, 1300);
  };

  return (
    <LinearGradient
      colors={['#F0531A', '#E34100', '#A82C00'] as const}
      locations={[0, 0.5, 1] as const}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* resplandor cálido + blobs decorativos */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -110, right: -90, width: 300, height: 300, borderRadius: 300, backgroundColor: 'rgba(255,196,120,0.22)' }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 40, right: -40, width: 150, height: 150, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.08)' }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 260, left: -70, width: 180, height: 180, borderRadius: 180, backgroundColor: 'rgba(2,22,66,0.10)' }}
      />

      {/* HERO */}
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ margin: 16, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)' }}
        >
          <ArrowLeft color="#fff" size={22} />
        </Pressable>

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 10 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#fff',
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 14,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 5 },
              elevation: 5,
            }}
          >
            <LogoSymbol width={140} />
          </View>
          <Text style={{ color: '#fff', fontSize: 40, lineHeight: 43, fontWeight: '800', marginTop: 22, letterSpacing: -0.5 }}>
            Tu antojo,{'\n'}al mostrador.
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15.5, lineHeight: 23, marginTop: 12, maxWidth: 300 }}>
            Pide desde tu celular y recoge en la cooperativa cuando esté listo. Sin filas, sin esperas a ciegas.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 }}>
            {PILLS.map((f) => (
              <View
                key={f}
                style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}
              >
                <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600' }}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* HOJA BLANCA — acción de login */}
      <View
        style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 18,
          gap: 16,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: -8 },
          elevation: 24,
        }}
      >
        <View style={{ alignSelf: 'center', width: 42, height: 5, borderRadius: 5, backgroundColor: '#E6E9F0' }} />

        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#021E5E' }}>Entra y pide lo tuyo</Text>
          <Text style={{ fontSize: 13.5, color: '#6C7689' }}>Usa tu cuenta institucional para continuar.</Text>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 11,
            height: 56,
            borderRadius: 18,
            backgroundColor: '#E34100',
            shadowColor: '#E34100',
            shadowOpacity: 0.35,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
            opacity: loading ? 0.85 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <MicrosoftGlyph size={15} />
            </View>
          )}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {loading ? 'Conectando con Outlook…' : 'Iniciar sesión con Outlook'}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 14, backgroundColor: '#F4F6FA' }}>
          <View style={{ marginTop: 1 }}>
            <Info color="#9BA4B5" size={15} />
          </View>
          <Text style={{ flex: 1, fontSize: 12, color: '#6C7689', lineHeight: 17 }}>
            Cuenta <Text style={{ color: '#021E5E', fontWeight: '700' }}>@utc.edu.mx</Text> gestionada por Microsoft. No creamos una contraseña adicional.
          </Text>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 11.5, color: '#9BA4B5' }}>
          Modalidad Pick Up · Solo recogida en tienda
        </Text>
      </View>
    </LinearGradient>
  );
}
