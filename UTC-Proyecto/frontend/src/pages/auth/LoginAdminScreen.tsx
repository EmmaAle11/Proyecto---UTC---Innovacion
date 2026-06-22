import { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck, LogIn, CircleAlert } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { LogoSymbol } from '../../shared/ui/LogoSymbol';
import { useSessionStore } from '../../features/auth/model/session.store';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginAdmin'>;

/** Login del administrador: correo + contraseña contra Keycloak (de design-system login-admin.html). */
export function LoginAdminScreen({ navigation }: Props) {
  const setSession = useSessionStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<'email' | 'pass' | null>(null);

  const handleLogin = () => {
    if (!email) return setError('Ingresa tu correo institucional');
    if (!email.includes('@')) return setError('Correo inválido');
    if (!pass) return setError('Ingresa tu contraseña');
    if (pass.length < 4) return setError('Contraseña incorrecta');
    setError('');
    setLoading(true);
    // Mock: en Fase 1 esto valida contra Keycloak (credenciales locales + MFA).
    setTimeout(() => {
      setLoading(false);
      // Mock: marca una sesión (placeholder) → el navegador cambia a Main. Auth admin real: paso futuro.
      setSession({ accessToken: 'mock-admin', refreshToken: '', email: email.trim().toLowerCase() });
    }, 1500);
  };

  const fieldBorder = (f: 'email' | 'pass') => (focus === f ? '#E34100' : '#DEE2EA');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#021E5E' }}>
      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* banda superior azul */}
        <View style={{ backgroundColor: '#021E5E', paddingHorizontal: 26, paddingTop: 16, paddingBottom: 30, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: -60, right: -50, width: 180, height: 180, borderRadius: 180, backgroundColor: 'rgba(227,65,0,0.20)' }} />
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 16 }}
          >
            <ArrowLeft color="#fff" size={22} />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 7 }}>
              <LogoSymbol width={58} />
            </View>
            <View>
              <Text style={{ fontWeight: '800', fontSize: 18, color: '#fff' }}>
                Pick <Text style={{ color: '#F26336' }}>Sazón</Text>
              </Text>
              <Text style={{ fontSize: 11, color: '#A6B6E0', fontWeight: '600', letterSpacing: 0.5, marginTop: 2 }}>
                PANEL DE ADMINISTRACIÓN
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck color="#F26336" size={15} />
            </View>
            <Text style={{ fontSize: 13, color: '#A6B6E0' }}>Acceso restringido · Solo administradores</Text>
          </View>
        </View>

        {/* formulario */}
        <View style={{ padding: 26, gap: 20 }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#021E5E' }}>Iniciar sesión</Text>
            <Text style={{ fontSize: 14, color: '#6C7689', marginTop: 4 }}>Usa tus credenciales de administrador.</Text>
          </View>

          {error ? (
            <View style={{ flexDirection: 'row', gap: 9, padding: 12, backgroundColor: '#FDECEC', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(215,38,61,0.18)' }}>
              <View style={{ marginTop: 1 }}>
                <CircleAlert color="#D7263D" size={17} />
              </View>
              <Text style={{ flex: 1, fontSize: 13.5, color: '#B01B30', fontWeight: '500' }}>{error}</Text>
            </View>
          ) : null}

          {/* correo */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#021E5E' }}>Correo</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 15, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: fieldBorder('email') }}>
              <Mail color="#6C7689" size={18} />
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                onFocus={() => setFocus('email')}
                onBlur={() => setFocus(null)}
                placeholder="admin@utc.edu.mx"
                placeholderTextColor="#9BA4B5"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ flex: 1, fontSize: 15, color: '#021E5E' }}
              />
            </View>
            <Text style={{ fontSize: 12, color: '#6C7689' }}>Cuenta de administrador UTC</Text>
          </View>

          {/* contraseña */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#021E5E' }}>Contraseña</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 15, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: fieldBorder('pass') }}>
              <Lock color="#6C7689" size={18} />
              <TextInput
                value={pass}
                onChangeText={(v) => { setPass(v); setError(''); }}
                onFocus={() => setFocus('pass')}
                onBlur={() => setFocus(null)}
                placeholder="••••••••"
                placeholderTextColor="#9BA4B5"
                secureTextEntry={!showPass}
                style={{ flex: 1, fontSize: 15, color: '#021E5E' }}
              />
              <Pressable onPress={() => setShowPass((s) => !s)} hitSlop={8}>
                {showPass ? <EyeOff color="#6C7689" size={20} /> : <Eye color="#6C7689" size={20} />}
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: 16, backgroundColor: '#021E5E', opacity: loading ? 0.85 : 1 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <LogIn color="#fff" size={20} />}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{loading ? 'Verificando…' : 'Entrar al panel'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
