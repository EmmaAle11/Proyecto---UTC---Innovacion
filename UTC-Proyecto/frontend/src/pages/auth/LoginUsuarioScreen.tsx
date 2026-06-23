import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Mail, Lock, User, Eye, EyeOff, CircleAlert, Info } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { AuthScaffold } from '../../widgets/auth/AuthScaffold';
import { BrandField } from '../../shared/ui/BrandField';
import { PrimaryButton } from '../../shared/ui/PrimaryButton';
import { registerCliente, loginCliente } from '../../features/auth/api/auth.api';
import { useSessionStore } from '../../features/auth/model/session.store';
import { ApiError } from '../../shared/api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginUsuario'>;
type Mode = 'register' | 'login';

const PILLS = ['⏱ Tiempos visibles', '📍 Pick Up', '✓ Paga con tarjeta'];
const UTC_DOMAIN = /@utc\.edu\.mx$/i;
const NARANJA = ['#F0531A', '#E34100', '#A82C00'] as const;

/** Login/registro del cliente: cuenta LOCAL en Keycloak vía backend (sin Microsoft). Ver D-014. */
export function LoginUsuarioScreen({ navigation }: Props) {
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
      let res: { access_token: string; refresh_token: string };
      if (isRegister) {
        const reg = await registerCliente({
          email: mail,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        // La cuenta ya se creó; si el auto-login no devolvió tokens, inicia sesión.
        res = reg.access_token
          ? { access_token: reg.access_token, refresh_token: reg.refresh_token ?? '' }
          : await loginCliente(mail, password);
      } else {
        res = await loginCliente(mail, password);
      }
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
      gradient={NARANJA}
      blobTint="rgba(2,22,66,0.10)"
      onBack={() => navigation.goBack()}
      title={'Tu antojo,\nal mostrador.'}
      accessory={
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PILLS.map((f) => (
            <View
              key={f}
              style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}
            >
              <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600' }}>{f}</Text>
            </View>
          ))}
        </View>
      }
    >
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
          <BrandField
            containerStyle={{ flex: 1 }}
            icon={<User color="#6C7689" size={17} />}
            value={firstName}
            onChangeText={setFirstName}
            focused={focus === 'first'}
            onFocus={() => setFocus('first')}
            onBlur={() => setFocus(null)}
            placeholder="Nombre"
          />
          <BrandField
            containerStyle={{ flex: 1 }}
            value={lastName}
            onChangeText={setLastName}
            focused={focus === 'last'}
            onFocus={() => setFocus('last')}
            onBlur={() => setFocus(null)}
            placeholder="Apellido"
          />
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
        placeholder="tucorreo@utc.edu.mx"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <BrandField
        icon={<Lock color="#6C7689" size={18} />}
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError('');
        }}
        focused={focus === 'pass'}
        onFocus={() => setFocus('pass')}
        onBlur={() => setFocus(null)}
        placeholder={isRegister ? 'Crea una contraseña (mín. 8)' : 'Tu contraseña'}
        secure={!showPass}
        rightSlot={
          <Pressable onPress={() => setShowPass((s) => !s)} hitSlop={8}>
            {showPass ? <EyeOff color="#6C7689" size={20} /> : <Eye color="#6C7689" size={20} />}
          </Pressable>
        }
      />

      <PrimaryButton
        color="#E34100"
        loading={loading}
        onPress={() => void handleSubmit()}
        label={
          loading
            ? isRegister
              ? 'Creando cuenta…'
              : 'Entrando…'
            : isRegister
              ? 'Crea tu cuenta con tu correo institucional'
              : 'Iniciar sesión'
        }
      />

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
            Solo cuentas <Text style={{ color: '#021E5E', fontWeight: '700' }}>@utc.edu.mx</Text>. Creas
            tu contraseña la primera vez · Modalidad Pick Up.
          </Text>
        </View>
      ) : (
        <Text style={{ textAlign: 'center', fontSize: 11.5, color: '#9BA4B5' }}>
          Modalidad Pick Up · Solo recogida en tienda
        </Text>
      )}
    </AuthScaffold>
  );
}
