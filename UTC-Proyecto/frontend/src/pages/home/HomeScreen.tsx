import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Zap, ShoppingBag, ArrowRight, Plus, ChevronDown } from 'lucide-react-native';
import { LogoSymbol } from '../../shared/ui/LogoSymbol';
import { Badge } from '../../shared/ui/Badge';
import { Chip } from '../../shared/ui/Chip';
import { Media } from '../../shared/ui/Media';
import { colors, text, border, surface } from '../../shared/theme';
import { PRODUCTS, CATEGORIES } from '../../entities/product/mock';
import { productIcon } from '../../entities/product/icons';
import { productImage } from '../../entities/product/images';
import { useCartStore, selectCount, selectTotal } from '../../features/cart/model/cart.store';
import { useBranchStore } from '../../features/branch/model/branch.store';
import { useBranchLocation } from '../../features/branch/lib/useBranchLocation';
import { BranchPicker } from '../../widgets/branch/BranchPicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';

/**
 * Inicio (Propuesta B "Mostrador"): header de pickup + rail "Listos para llevar ya"
 * + chips de categoría + feed. La barra flotante aparece al agregar al carrito.
 * M1: tocar una tarjeta agrega al carrito (quick add). M2: la tarjeta navegará al
 * detalle del producto y la barra abrirá el Carrito.
 */
export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [cat, setCat] = useState('Todo');
  const items = useCartStore((s) => s.items);
  const count = selectCount(items);
  const total = selectTotal(items);
  const selectedBranch = useBranchStore((s) => s.selected);
  const [branchOpen, setBranchOpen] = useState(false);
  const { status: locStatus, locate } = useBranchLocation(true); // intenta ubicar al montar

  const available = PRODUCTS.filter((p) => p.isAvailable && p.status !== 'no_disponible');
  const ready = available.filter((p) => p.readySinceMin != null);
  const list = cat === 'Todo' ? available : available.filter((p) => p.category === cat);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      {/* HEADER (fijo) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: border.subtle }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pressable onPress={() => setBranchOpen(true)} hitSlop={6}>
            <Text style={{ fontSize: 12, color: text.muted, fontWeight: '600' }}>Recoges en</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MapPin size={16} color={colors.naranja[500]} />
              <Text style={{ fontWeight: '800', fontSize: 18, color: text.heading }}>{selectedBranch.name}</Text>
              {locStatus === 'loading' ? <ActivityIndicator size="small" color={text.muted} /> : <ChevronDown size={18} color={text.muted} />}
            </View>
          </Pressable>
          <LogoSymbol width={40} />
        </View>
        {/* búsqueda (visual, no funcional aún) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, backgroundColor: colors.gris[100], borderRadius: 14 }}>
          <Search size={18} color={text.muted} />
          <Text style={{ color: text.muted, fontSize: 15 }}>¿Qué se te antoja hoy?</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: count > 0 ? 150 : 24 }} showsVerticalScrollIndicator={false}>
        {/* RAIL "Listos para llevar ya" */}
        <View style={{ paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, paddingBottom: 10 }}>
            <Zap size={18} color={colors.lima[500]} />
            <Text style={{ fontWeight: '800', fontSize: 16, color: text.heading }}>Listos para llevar ya</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {ready.map((p) => {
              const Icon = productIcon(p.icon);
              return (
                <Pressable key={p.id} onPress={() => navigation.navigate('Product', { productId: p.id })} style={{ width: 158, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.lima[100], borderRadius: 16, padding: 9 }}>
                  <Media height={84} radius={12} source={productImage(p.id)} icon={<Icon size={34} color={colors.azul[300]} />}>
                    <View style={{ position: 'absolute', top: 7, left: 7 }}>
                      <Badge tone="ready" dot>Listo</Badge>
                    </View>
                  </Media>
                  <Text style={{ fontWeight: '700', fontSize: 13.5, color: text.heading, marginTop: 8, marginBottom: 3 }}>{p.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.lima[600], fontWeight: '600', marginBottom: 7 }}>Listo hace {p.readySinceMin} min</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '700', fontSize: 15, color: text.heading }}>{`$${p.price}`}</Text>
                    <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={18} color="#fff" />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* CHIPS de categoría */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 12, paddingBottom: 14 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} selected={c === cat} onPress={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </ScrollView>

        {/* FEED */}
        <View style={{ gap: 12, paddingHorizontal: 20 }}>
          {list.map((p) => {
            const Icon = productIcon(p.icon);
            return (
              <Pressable key={p.id} onPress={() => navigation.navigate('Product', { productId: p.id })} style={{ flexDirection: 'row', gap: 13, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: border.subtle, borderRadius: 18, padding: 11 }}>
                <Media height={78} radius={13} style={{ width: 78 }} source={productImage(p.id)} icon={<Icon size={30} color={colors.azul[300]} />} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Text style={{ fontWeight: '700', fontSize: 15.5, color: text.heading }}>{p.name}</Text>
                    {p.popular ? <Text style={{ fontSize: 12 }}>🔥</Text> : null}
                  </View>
                  <Text style={{ fontSize: 12, color: text.muted, marginBottom: 8 }}>
                    {p.readySinceMin != null ? (
                      <Text style={{ color: colors.lima[600], fontWeight: '600' }}>Listo hace {p.readySinceMin} min</Text>
                    ) : (
                      <Text>⏱ {Math.round(p.basePrepTimeSeconds / 60)} min de espera</Text>
                    )}
                    {` · ${p.category}`}
                  </Text>
                  <Text style={{ fontWeight: '700', fontSize: 17, color: text.heading }}>{`$${p.price}`}</Text>
                </View>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={21} color="#fff" />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* BARRA FLOTANTE DE CARRITO (M2: abrirá el Carrito) */}
      {count > 0 ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
          <Pressable
            onPress={() => navigation.navigate('Cart')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 54,
              borderRadius: 16,
              backgroundColor: colors.primary,
              paddingHorizontal: 18,
              shadowColor: colors.primary,
              shadowOpacity: 0.32,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{count} en tu pedido</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{`$${total} · Ver pedido`}</Text>
              <ArrowRight size={18} color="#fff" />
            </View>
          </Pressable>
        </View>
      ) : null}

      <BranchPicker
        visible={branchOpen}
        onClose={() => setBranchOpen(false)}
        locating={locStatus === 'loading'}
        denied={locStatus === 'denied'}
        onUseLocation={() => void locate()}
      />
    </SafeAreaView>
  );
}
