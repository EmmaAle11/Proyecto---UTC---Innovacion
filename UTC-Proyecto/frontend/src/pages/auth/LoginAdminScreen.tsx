import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck, LogIn, CircleAlert } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { AuthScaffold } from '../../widgets/auth/AuthScaffold';
import { BrandField } from '../../shared/ui/BrandField';
import { PrimaryButton } from '../../shared/ui/PrimaryButton';
import { useSessionStore } from '../../features/auth/model/session.store';
import { loginAdmin } from '../../features/auth/api/auth.api';
import { ApiError } from '../../shared/api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginAdmin'>;

const AZUL = ['#0A2E7A', '#021E5E', '#010E2E'] as const;

/** Login del administrador: correo + contraseña + MFA (totp) contra Keycloak. Hero azul armonizado. Ver D-014, rules §6. */
export function LoginAdminScreen({ navigation }: Props) {
  const setSession = useSessionStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totp, setTotp] = useState('');
  const [focus, setFocus] = useState<'email' | 'pass' | 'totp' | null>(null);

  const handleLogin = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail) return setError('Ingresa tu correo institucional');
    if (!mail.includes('@')) return setError('Correo inválido');
    if (!pass) return setError('Ingresa tu contraseña');
    if (!/^[0-9]{6}$/.test(totp)) return setError('Ingresa el código de 6 dígitos');
    setError('');
    setLoading(true);
    try {
      const res = await loginAdmin(mail, pass, totp);
      // setSession cambia el navegador a Main (guard de sesión, ver RootNavigator).
      setSession({ accessToken: res.access_token, refreshToken: res.refresh_token, email: mail });
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor. Revisa tu red.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      gradient={AZUL}
      blobTint="rgba(227,65,0,0.18)"
      onBack={() => navigation.goBack()}
      title={'Panel de\nadministración.'}
      accessory={
        <View
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}
        >
          <ShieldCheck color="#F26336" size={15} />
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600' }}>
            Acceso restringido · Solo administradores
          </Text>
        </View>
      }
    >
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#021E5E' }}>Iniciar sesión</Text>
        <Text style={{ fontSize: 13.5, color: '#6C7689' }}>Usa tus credenciales de administrador</Text>
      </View>

      {error ? (
        <View style={{ flexDirection: 'row', gap: 9, padding: 11, backgroundColor: '#FDECEC', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(215,38,61,0.18)' }}>
          <CircleAlert color="#D7263D" size={17} />
          <Text style={{ flex: 1, fontSize: 13, color: '#B01B30', fontWeight: '500' }}>{error}</Text>
        </View>
      ) : null}

      <BrandField
        icon={<Mail color="#6C7689" size={18} />}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setError('');
        }}
        focused={focus === 'email'}
        onFocus={() => setFocus('email')}
        onBlur={() => setFocus(null)}
        placeholder="admin@utc.edu.mx"
        keyboardType="email-address"
        autoCapitalize="none"
        hint="Cuenta de administrador UTC"
      />

      <BrandField
        icon={<Lock color="#6C7689" size={18} />}
        value={pass}
        onChangeText={(v) => {
          setPass(v);
          setError('');
        }}
        focused={focus === 'pass'}
        onFocus={() => setFocus('pass')}
        onBlur={() => setFocus(null)}
        placeholder="••••••••"
        secure={!showPass}
        rightSlot={
          <Pressable onPress={() => setShowPass((s) => !s)} hitSlop={8}>
            {showPass ? <EyeOff color="#6C7689" size={20} /> : <Eye color="#6C7689" size={20} />}
          </Pressable>
        }
      />

      <BrandField
        icon={<KeyRound color="#6C7689" size={18} />}
        value={totp}
        onChangeText={(v) => {
          setTotp(v.replace(/[^0-9]/g, '').slice(0, 6));
          setError('');
        }}
        focused={focus === 'totp'}
        onFocus={() => setFocus('totp')}
        onBlur={() => setFocus(null)}
        placeholder="Código de 6 dígitos"
        keyboardType="number-pad"
        hint="App autenticadora (Google/Microsoft Authenticator)"
      />

      <PrimaryButton
        color="#021E5E"
        loading={loading}
        onPress={() => void handleLogin()}
        icon={<LogIn color="#fff" size={20} />}
        label={loading ? 'Verificando…' : 'Entrar al panel'}
      />

      <Text style={{ textAlign: 'center', fontSize: 11.5, color: '#9BA4B5' }}>
        Acceso solo para personal autorizado · Verificación MFA
      </Text>
    </AuthScaffold>
  );
}
