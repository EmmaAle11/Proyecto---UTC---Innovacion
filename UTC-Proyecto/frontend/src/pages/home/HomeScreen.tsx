import { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Zap, ShoppingBag, ArrowRight, Plus, ChevronDown } from 'lucide-react-native';
import { LogoSymbol } from '../../shared/ui/LogoSymbol';
import { Badge } from '../../shared/ui/Badge';
import { Chip } from '../../shared/ui/Chip';
import { Media } from '../../shared/ui/Media';
import { Display, Heading, Title, Body, Label, Mono } from '../../shared/ui/Type';
import { colors, text, border, surface, shadow, fonts } from '../../shared/theme';
import { productIcon } from '../../entities/product/icons';
import { productImage } from '../../entities/product/images';
import { useSessionStore } from '../../features/auth/model/session.store';
import { useCatalogStore } from '../../features/catalog/model/catalog.store';
import { useCartStore, selectCount, selectTotal } from '../../features/cart/model/cart.store';
import { useBranchStore } from '../../features/branch/model/branch.store';
import { useBranchLocation } from '../../features/branch/lib/useBranchLocation';
import { BranchPicker } from '../../widgets/branch/BranchPicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../app/navigation/types';

/**
 * Inicio (identidad "Editorial Street-Food", D-020): header de pickup + hero
 * editorial + rail "Listos para llevar ya" + chips + feed. Precios en Space Mono
 * (aire de ticket). La barra flotante aparece al agregar al carrito.
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

  // Catálogo real (GET /products) vía store compartido; ProductScreen lee el mismo.
  const token = useSessionStore((s) => s.session?.accessToken);
  const products = useCatalogStore((s) => s.products);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);
  const loadCatalog = useCatalogStore((s) => s.load);
  useEffect(() => {
    void loadCatalog(token);
  }, [token, loadCatalog]);

  const available = products.filter((p) => p.isAvailable && p.status !== 'no_disponible');
  const ready = available.filter((p) => p.status === 'sin_tiempo_espera' || p.status === 'preparado');
  const list = cat === 'Todo' ? available : available.filter((p) => p.category === cat);
  const categories = ['Todo', ...Array.from(new Set(available.map((p) => p.category)))];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: surface.page }}>
      {/* HEADER (fijo) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, backgroundColor: surface.card, borderBottomWidth: 1, borderBottomColor: border.subtle }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => setBranchOpen(true)} hitSlop={6}>
            <Label>Recoges en</Label>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <MapPin size={16} color={colors.naranja[500]} />
              <Heading style={{ fontSize: 18, lineHeight: 22 }}>{selectedBranch.name}</Heading>
              {locStatus === 'loading' ? <ActivityIndicator size="small" color={text.muted} /> : <ChevronDown size={18} color={text.muted} />}
            </View>
          </Pressable>
          <LogoSymbol width={40} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: count > 0 ? 150 : 24 }} showsVerticalScrollIndicator={false}>
        {/* HERO editorial */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 }}>
          <Display>¿Qué se te{'\n'}antoja hoy?</Display>
          <View style={{ width: 58, height: 6, borderRadius: 3, backgroundColor: colors.naranja[500], marginTop: 10 }} />
        </View>

        {/* búsqueda (visual, no funcional aún) */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, backgroundColor: colors.gris[100], borderRadius: 14 }}>
            <Search size={18} color={text.muted} />
            <Body color={text.muted} style={{ fontSize: 15 }}>Busca tu antojo…</Body>
          </View>
        </View>

        {/* Cargando catálogo */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {/* Error de carga (prod: sin fallback a mock, BR-015) */}
        {!loading && error && products.length === 0 ? (
          <View style={{ paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' }}>
            <Body color={text.muted} style={{ textAlign: 'center' }}>
              No pudimos cargar el menú. Revisa tu conexión e inténtalo de nuevo.
            </Body>
          </View>
        ) : null}

        {/* RAIL "Listos para llevar ya" (solo si hay listos) */}
        {ready.length > 0 ? (
        <View style={{ paddingTop: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, paddingBottom: 11 }}>
            <Zap size={18} color={colors.lima[500]} />
            <Heading style={{ fontSize: 17, lineHeight: 20 }}>Listos para llevar ya</Heading>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {ready.map((p) => {
              const Icon = productIcon(p.icon);
              return (
                <Pressable key={p.id} onPress={() => navigation.navigate('Product', { productId: p.id })} style={{ width: 158, backgroundColor: surface.card, borderWidth: 1, borderColor: colors.lima[100], borderRadius: 16, padding: 9, ...shadow.card }}>
                  <Media height={84} radius={12} source={productImage(p)} icon={<Icon size={34} color={colors.azul[300]} />}>
                    <View style={{ position: 'absolute', top: 7, left: 7 }}>
                      <Badge tone="ready" dot>Listo</Badge>
                    </View>
                  </Media>
                  <Title style={{ fontSize: 13.5, marginTop: 8, marginBottom: 3 }} numberOfLines={1}>{p.name}</Title>
                  <Body color={colors.lima[600]} style={{ fontSize: 11, fontFamily: fonts.bodySemi, marginBottom: 7 }}>{p.readySinceMin != null ? `Listo hace ${p.readySinceMin} min` : 'Sin tiempo de espera'}</Body>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Mono style={{ fontFamily: fonts.monoBold, fontSize: 15 }} color={text.heading}>{`$${p.price}`}</Mono>
                    <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={18} color="#fff" />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        ) : null}

        {/* CHIPS de categoría */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 16, paddingBottom: 14 }}>
          {categories.map((c) => (
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
              <Pressable key={p.id} onPress={() => navigation.navigate('Product', { productId: p.id })} style={{ flexDirection: 'row', gap: 13, alignItems: 'center', backgroundColor: surface.card, borderWidth: 1, borderColor: border.subtle, borderRadius: 18, padding: 11, ...shadow.card }}>
                <Media height={78} radius={13} style={{ width: 78 }} source={productImage(p)} icon={<Icon size={30} color={colors.azul[300]} />} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Title style={{ fontSize: 15.5 }} numberOfLines={1}>{p.name}</Title>
                    {p.popular ? <Body style={{ fontSize: 12 }}>🔥</Body> : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    {p.status === 'sin_tiempo_espera' || p.status === 'preparado' ? (
                      <Body color={colors.lima[600]} style={{ fontSize: 12, fontFamily: fonts.bodySemi }}>Listo · sin espera</Body>
                    ) : (
                      <Body color={text.muted} style={{ fontSize: 12 }}>⏱ {Math.round(p.basePrepTimeSeconds / 60)} min de espera</Body>
                    )}
                    <Body color={text.muted} style={{ fontSize: 12 }}>{` · ${p.category}`}</Body>
                  </View>
                  <Mono style={{ fontFamily: fonts.monoBold, fontSize: 17 }} color={text.heading}>{`$${p.price}`}</Mono>
                </View>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={21} color="#fff" />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* BARRA FLOTANTE DE CARRITO */}
      {count > 0 ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
          <Pressable
            onPress={() => navigation.navigate('Cart')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 56,
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
              <Title color="#fff" style={{ fontSize: 15 }}>{count} en tu pedido</Title>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Mono color="#fff" style={{ fontFamily: fonts.monoBold, fontSize: 15 }}>{`$${total}`}</Mono>
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
