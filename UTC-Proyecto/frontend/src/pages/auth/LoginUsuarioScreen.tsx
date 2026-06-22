import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CircleAlert, Info } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { LogoSymbol } from '../../shared/ui/LogoSymbol';
import { registerCliente, loginCliente } from '../../features/auth/api/auth.api';
import { useSessionStore } from '../../features/auth/model/session.store';
import { ApiError } from '../../shared/api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginUsuario'>;
type Mode = 'register' | 'login';

const PILLS = ['⏱ Tiempos visibles', '📍 Pick Up', '✓ Paga con tarjeta'];
const UTC_DOMAIN = /@utc\.edu\.mx$/i;

/** Login/registro del cliente: cuenta LOCAL en Keycloak vía backend (sin Microsoft). Ver D-014. */
export function LoginUsuarioScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setSession = useSessionStore((s) => s.setSession);

  const [mode, setMode] = useState<Mode>('register');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    const mail = email.trim().toLowerCase();
    if (!mail) return setError('Ingresa tu correo institucional');
    if (!UTC_DOMAIN.test(mail)) return setError('Usa tu correo @utc.edu.mx');
    if (isRegister && (!firstName.trim() || !lastName.trim()))
      return setError('Ingresa tu nombre y apellido');
    if (isRegister && password.length < 8)
      return setError('La contraseña debe tener al menos 8 caracteres');
    if (!isRegister && !password) return setError('Ingresa tu contraseña');

    setLoading(true);
    try {
      const res = isRegister
        ? await registerCliente({
            email: mail,
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          })
        : await loginCliente(mail, password);
      setSession({ accessToken: res.access_token, refreshToken: res.refresh_token, email: mail });
      navigation.navigate('Main');
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor. Revisa tu red.',
      );
    } finally {
      setLoading(false);
    }
  };

  const border = (f: string) => (focus === f ? '#E34100' : '#DEE2EA');

  return (
    <LinearGradient
      colors={['#F0531A', '#E34100', '#A82C00'] as const}
      locations={[0, 0.5, 1] as const}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -110, right: -90, width: 300, height: 300, borderRadius: 300, backgroundColor: 'rgba(255,196,120,0.22)' }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 260, left: -70, width: 180, height: 180, borderRadius: 180, backgroundColor: 'rgba(2,22,66,0.10)' }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HERO */}
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ margin: 16, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)' }}
          >
            <ArrowLeft color="#fff" size={22} />
          </Pressable>

          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 8 }}>
            <View
              style={{ alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 5 }}
            >
              <LogoSymbol width={120} />
            </View>
            <Text style={{ color: '#fff', fontSize: 36, lineHeight: 39, fontWeight: '800', marginTop: 18, letterSpacing: -0.5 }}>
              Tu antojo,{'\n'}al mostrador.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
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

        {/* HOJA BLANCA — formulario */}
        <View
          style={{ backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 14, paddingBottom: insets.bottom + 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: -8 }, elevation: 24 }}
        >
          <View style={{ alignSelf: 'center', width: 42, height: 5, borderRadius: 5, backgroundColor: '#E6E9F0' }} />

          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#021E5E' }}>
              {isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}
            </Text>
            <Text style={{ fontSize: 13.5, color: '#6C7689' }}>
              {isRegister ? 'Con tu correo institucional @utc.edu.mx' : 'Con tu correo y contraseña'}
            </Text>
          </View>

          {error ? (
            <View style={{ flexDirection: 'row', gap: 9, padding: 11, backgroundColor: '#FDECEC', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(215,38,61,0.18)' }}>
              <CircleAlert color="#D7263D" size={17} />
              <Text style={{ flex: 1, fontSize: 13, color: '#B01B30', fontWeight: '500' }}>{error}</Text>
            </View>
          ) : null}

          {isRegister ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1.5, borderColor: border('first') }}>
                <User color="#6C7689" size={17} />
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFocus('first')}
                  onBlur={() => setFocus(null)}
                  placeholder="Nombre"
                  placeholderTextColor="#9BA4B5"
                  style={{ flex: 1, fontSize: 15, color: '#021E5E' }}
                />
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1.5, borderColor: border('last') }}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => setFocus('last')}
                  onBlur={() => setFocus(null)}
                  placeholder="Apellido"
                  placeholderTextColor="#9BA4B5"
                  style={{ flex: 1, fontSize: 15, color: '#021E5E' }}
                />
              </View>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: border('email') }}>
            <Mail color="#6C7689" size={18} />
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              onFocus={() => setFocus('email')}
              onBlur={() => setFocus(null)}
              placeholder="tucorreo@utc.edu.mx"
              placeholderTextColor="#9BA4B5"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ flex: 1, fontSize: 15, color: '#021E5E' }}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: border('pass') }}>
            <Lock color="#6C7689" size={18} />
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              onFocus={() => setFocus('pass')}
              onBlur={() => setFocus(null)}
              placeholder={isRegister ? 'Crea una contraseña (mín. 8)' : 'Tu contraseña'}
              placeholderTextColor="#9BA4B5"
              secureTextEntry={!showPass}
              style={{ flex: 1, fontSize: 15, color: '#021E5E' }}
            />
            <Pressable onPress={() => setShowPass((s) => !s)} hitSlop={8}>
              {showPass ? <EyeOff color="#6C7689" size={20} /> : <Eye color="#6C7689" size={20} />}
            </Pressable>
          </View>

          <Pressable
            onPress={() => void handleSubmit()}
            disabled={loading}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: 16, backgroundColor: '#E34100', marginTop: 2, shadowColor: '#E34100', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6, opacity: loading ? 0.85 : 1 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : null}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15.5 }}>
              {loading
                ? isRegister ? 'Creando cuenta…' : 'Entrando…'
                : isRegister ? 'Crea tu cuenta con tu correo institucional' : 'Iniciar sesión'}
            </Text>
          </Pressable>

          <Pressable onPress={switchMode} hitSlop={6} style={{ alignSelf: 'center', paddingVertical: 2 }}>
            <Text style={{ fontSize: 13.5, color: '#6C7689' }}>
              {isRegister ? '¿Ya tienes cuenta? ' : '¿Nuevo aquí? '}
              <Text style={{ color: '#E34100', fontWeight: '700' }}>
                {isRegister ? 'Inicia sesión' : 'Crea tu cuenta'}
              </Text>
            </Text>
          </Pressable>

          {isRegister ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 2 }}>
              <Info color="#9BA4B5" size={14} />
              <Text style={{ flex: 1, fontSize: 11.5, color: '#9BA4B5', lineHeight: 16 }}>
                Solo cuentas <Text style={{ color: '#021E5E', fontWeight: '700' }}>@utc.edu.mx</Text>. Creas tu contraseña la primera vez · Modalidad Pick Up.
              </Text>
            </View>
          ) : (
            <Text style={{ textAlign: 'center', fontSize: 11.5, color: '#9BA4B5' }}>
              Modalidad Pick Up · Solo recogida en tienda
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
