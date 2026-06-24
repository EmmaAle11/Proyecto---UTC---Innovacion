import { View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { LogoSymbol } from '../../shared/ui/LogoSymbol';
import { Display } from '../../shared/ui/Type';
import { surface, text, shadow } from '../../shared/theme';

type Props = {
  gradient: readonly [string, string, string];
  blobTint: string; // tinte del blob secundario (acento por rol)
  onBack: () => void;
  title: string; // título del hero (admite \n para 2 líneas)
  accessory: ReactNode; // píldoras (cliente) o chip (admin)
  children: ReactNode; // contenido de la hoja blanca
};

/**
 * Esqueleto común de las pantallas de auth: hero con degradado + blobs + logo + título +
 * accesorio, y una hoja blanca inferior con el formulario. Cliente y admin comparten esta
 * estructura; solo cambian el color del degradado y el contenido (ver D-014 / armonía de login).
 */
export function AuthScaffold({ gradient, blobTint, onBack, title, accessory, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradient}
      locations={[0, 0.5, 1] as const}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -110, right: -90, width: 300, height: 300, borderRadius: 300, backgroundColor: 'rgba(255,255,255,0.14)' }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 260, left: -70, width: 180, height: 180, borderRadius: 180, backgroundColor: blobTint }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* HERO */}
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <Pressable
            onPress={onBack}
            style={{ margin: 16, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)' }}
          >
            <ArrowLeft color="#fff" size={22} />
          </Pressable>

          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 8 }}>
            <View
              style={{ alignSelf: 'flex-start', backgroundColor: surface.card, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, ...shadow.floating }}
            >
              <LogoSymbol width={120} />
            </View>
            <Display color={text.onInk} style={{ fontSize: 38, lineHeight: 41, marginTop: 18 }}>
              {title}
            </Display>
            <View style={{ marginTop: 18 }}>{accessory}</View>
          </View>
        </SafeAreaView>

        {/* HOJA BLANCA */}
        <View
          style={{ backgroundColor: surface.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 14, paddingBottom: insets.bottom + 16, gap: 12, shadowColor: '#0A1430', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: -8 }, elevation: 24 }}
        >
          <View style={{ alignSelf: 'center', width: 42, height: 5, borderRadius: 5, backgroundColor: '#E6E9F0' }} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
