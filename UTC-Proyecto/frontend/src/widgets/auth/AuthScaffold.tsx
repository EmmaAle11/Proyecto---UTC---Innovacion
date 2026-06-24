import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
 * accesorio, y una hoja blanca inferior con el formulario. Todo va dentro de un ScrollView
 * para que en pantallas chicas (o con el teclado abierto) NO se amontone ni se corte el
 * contenido. Cliente y admin comparten esta estructura; solo cambian el color del degradado
 * y el contenido (ver D-014 / armonía de login, D-018).
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
        style={{ position: 'absolute', top: 220, left: -70, width: 170, height: 170, borderRadius: 170, backgroundColor: blobTint }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* HERO (altura natural, no se come la pantalla) */}
          <SafeAreaView edges={['top']}>
            <Pressable
              onPress={onBack}
              style={{ margin: 14, width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)' }}
            >
              <ArrowLeft color="#fff" size={20} />
            </Pressable>

            <View style={{ paddingHorizontal: 28, paddingTop: 2, paddingBottom: 22 }}>
              <View
                style={{ alignSelf: 'flex-start', backgroundColor: surface.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10, ...shadow.floating }}
              >
                <LogoSymbol width={84} />
              </View>
              <Display color={text.onInk} style={{ fontSize: 29, lineHeight: 32, marginTop: 14 }}>
                {title}
              </Display>
              <View style={{ marginTop: 12 }}>{accessory}</View>
            </View>
          </SafeAreaView>

          {/* HOJA BLANCA (crece para llenar el resto; hace scroll si no cabe) */}
          <View
            style={{ flexGrow: 1, backgroundColor: surface.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 14, paddingBottom: insets.bottom + 18, gap: 11, shadowColor: '#0A1430', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: -8 }, elevation: 24 }}
          >
            <View style={{ alignSelf: 'center', width: 42, height: 5, borderRadius: 5, backgroundColor: '#E6E9F0' }} />
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
