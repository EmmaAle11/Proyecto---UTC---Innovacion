import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, ShieldCheck, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { LogoLockup } from '../../shared/ui/LogoLockup';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

/** Landing: el usuario elige si entra como Cliente o como Administrador. */
export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingHorizontal: 28,
          paddingVertical: 28,
        }}
      >
        {/* marca */}
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <LogoLockup width={250} />
        </View>

        {/* elección de rol */}
        <View style={{ gap: 14, marginVertical: 28 }}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 12,
              fontWeight: '700',
              color: '#9BA4B5',
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            ¿CÓMO QUIERES ENTRAR?
          </Text>

          <Pressable
            onPress={() => navigation.navigate('LoginUsuario')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              borderRadius: 20,
              backgroundColor: '#E34100',
              padding: 18,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag color="#fff" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>Soy Cliente</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                Estudiante · pide y recoge tu antojo
              </Text>
            </View>
            <ChevronRight color="#fff" size={22} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('LoginAdmin')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              borderRadius: 20,
              backgroundColor: '#021E5E',
              padding: 18,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck color="#F26336" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>Soy Administrador</Text>
              <Text style={{ fontSize: 13, color: '#A6B6E0', marginTop: 2 }}>
                Cocina · gestiona productos y pedidos
              </Text>
            </View>
            <ChevronRight color="#fff" size={22} />
          </Pressable>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 12, color: '#9BA4B5' }}>
          Modalidad Pick Up · Solo recogida en tienda
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
